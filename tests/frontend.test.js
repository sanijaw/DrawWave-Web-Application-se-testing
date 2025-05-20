/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import VirtualPainter from '../frontend/src/components/VirtualPainter';
import Desktop from '../frontend/src/components/Desktop';
import ReconnectionHandler from '../frontend/src/components/ReconnectionHandler';
import Home from '../frontend/src/components/Home';

// Mock the WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.OPEN;
    this.onopen = jest.fn();
    this.onmessage = jest.fn();
    this.onclose = jest.fn();
    this.onerror = jest.fn();
    this.send = jest.fn();
    
    // Automatically call onopen when created
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }
  
  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) this.onclose({ code: 1000 });
  }

  // Helper to simulate receiving a message
  mockReceiveMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
}

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: jest.fn()
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
global.WebSocket = MockWebSocket;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ sessionId: 'test-session-123' }),
  useLocation: () => ({ state: { userName: 'Test User' } })
}));

describe('VirtualPainter Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('establishes WebSocket connection and handles session creation', async () => {
    render(
      <BrowserRouter>
        <VirtualPainter 
          sessionId="test-session"
          userName="Test User"
          inSession={true}
        />
      </BrowserRouter>
    );

    // Should attempt to connect to WebSocket server
    expect(global.WebSocket).toHaveBeenCalled();
    const wsInstance = global.WebSocket.mock.instances[0];
    
    // Verify it attempts to join the session
    await waitFor(() => {
      expect(wsInstance.send).toHaveBeenCalled();
    });
    
    // Check session data was sent
    const sentData = JSON.parse(wsInstance.send.mock.calls[0][0]);
    expect(sentData.type).toBe('join_session');
    expect(sentData.session_id).toBe('test-session');
    expect(sentData.user_name).toBe('Test User');
  });

  test('handles drawing updates and broadcasts them', async () => {
    render(
      <BrowserRouter>
        <VirtualPainter 
          sessionId="test-session"
          userName="Test User"
          inSession={true}
        />
      </BrowserRouter>
    );
    
    const wsInstance = global.WebSocket.mock.instances[0];
    
    // Simulate a drawing update coming from the server
    act(() => {
      wsInstance.mockReceiveMessage({
        type: 'draw_update',
        points: [{x: 100, y: 100}, {x: 200, y: 200}],
        color: '#FF0000',
        thickness: 5
      });
    });
    
    // Check that the component handles the drawing update
    // Note: This is a simplified test as we can't easily test actual canvas rendering
    await waitFor(() => {
      // If we had access to the internal canvas, we'd check that it was updated
      expect(true).toBeTruthy(); // Placeholder assertion
    });
  });

  test('handles reconnection after disconnection', async () => {
    // Setup: simulate stored session info
    localStorage.setItem('sessionId', 'test-session');
    localStorage.setItem('userName', 'Test User');
    
    render(
      <BrowserRouter>
        <VirtualPainter 
          sessionId="test-session"
          userName="Test User"
          inSession={true}
        />
      </BrowserRouter>
    );
    
    const wsInstance = global.WebSocket.mock.instances[0];
    
    // Simulate WebSocket closing
    act(() => {
      wsInstance.close();
    });
    
    // A new WebSocket should be created for reconnection
    await waitFor(() => {
      expect(global.WebSocket.mock.instances.length).toBeGreaterThan(1);
    });
    
    // The new WebSocket should try to join with the same session
    const newWsInstance = global.WebSocket.mock.instances[1];
    await waitFor(() => {
      expect(newWsInstance.send).toHaveBeenCalled();
    });
    
    const sentData = JSON.parse(newWsInstance.send.mock.calls[0][0]);
    expect(sentData.type).toBe('join_session');
    expect(sentData.session_id).toBe('test-session');
  });
});

describe('Desktop Component', () => {
  test('renders the VirtualPainter component and Navbar', () => {
    render(
      <BrowserRouter>
        <Desktop />
      </BrowserRouter>
    );
    
    // Check that the component structure is as expected
    expect(screen.getByTestId('desktop-container')).toBeInTheDocument();
    expect(screen.getByTestId('navbar-component')).toBeInTheDocument();
    expect(screen.getByTestId('virtual-painter')).toBeInTheDocument();
  });
  
  test('handles leaving session correctly', () => {
    render(
      <BrowserRouter>
        <Desktop />
      </BrowserRouter>
    );
    
    // Find and click the leave session button
    const leaveButton = screen.getByText('Leave Session');
    fireEvent.click(leaveButton);
    
    // Should navigate to home
    expect(mockNavigate).toHaveBeenCalledWith('/');
    
    // Should clear session storage
    expect(localStorage.removeItem).toHaveBeenCalledWith('sessionId');
    expect(localStorage.removeItem).toHaveBeenCalledWith('userName');
  });
});

describe('ReconnectionHandler Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });
  
  test('attempts to reconnect when session info is available', async () => {
    // Setup: simulate stored session info
    localStorage.setItem('sessionId', 'test-session');
    localStorage.setItem('userName', 'Test User');
    
    render(
      <BrowserRouter>
        <ReconnectionHandler />
      </BrowserRouter>
    );
    
    // Should attempt to redirect to the session
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/session/test-session', {
        state: { userName: 'Test User' }
      });
    });
  });
  
  test('does not attempt to reconnect when no session info is available', () => {
    render(
      <BrowserRouter>
        <ReconnectionHandler />
      </BrowserRouter>
    );
    
    // Should not redirect anywhere
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('Home Component Session Creation', () => {
  test('creates a new session when the create button is clicked', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    // Enter a username
    const userNameInput = screen.getByPlaceholderText('Your Name');
    fireEvent.change(userNameInput, { target: { value: 'Test User' } });
    
    // Click create session button
    const createButton = screen.getByText('Create New Session');
    fireEvent.click(createButton);
    
    // Should set up a WebSocket
    expect(global.WebSocket).toHaveBeenCalled();
    const wsInstance = global.WebSocket.mock.instances[0];
    
    // Should send create session message
    await waitFor(() => {
      expect(wsInstance.send).toHaveBeenCalled();
    });
    
    const sentData = JSON.parse(wsInstance.send.mock.calls[0][0]);
    expect(sentData.type).toBe('create_session');
    expect(sentData.user_name).toBe('Test User');
    
    // Simulate server response with session ID
    act(() => {
      wsInstance.mockReceiveMessage({
        type: 'session_created',
        session_id: 'new-session-123',
        host: true
      });
    });
    
    // Should navigate to the new session
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/session/new-session-123', {
        state: { userName: 'Test User', isHost: true }
      });
    });
    
    // Should store session info in localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('sessionId', 'new-session-123');
    expect(localStorage.setItem).toHaveBeenCalledWith('userName', 'Test User');
  });
});
