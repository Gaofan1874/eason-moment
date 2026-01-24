import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import UpdateNotifier from './UpdateNotifier';

// Mock ipcRenderer
const mockIpcRenderer = {
  on: vi.fn(),
  removeAllListeners: vi.fn(),
  send: vi.fn(),
};

describe('UpdateNotifier', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    // Inject mock into window
    Object.defineProperty(window, 'ipcRenderer', {
      value: mockIpcRenderer,
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up
    // @ts-ignore
    window.ipcRenderer = undefined;
  });

  it('should not render initially', () => {
    const { container } = render(<UpdateNotifier />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should show "update available" message with buttons', () => {
    render(<UpdateNotifier />);
    
    expect(mockIpcRenderer.on).toHaveBeenCalledWith('update-message', expect.any(Function));
    
    const handleUpdate = mockIpcRenderer.on.mock.calls.find(call => call[0] === 'update-message')?.[1];
    
    act(() => {
      handleUpdate && handleUpdate({}, { type: 'available', info: { version: '1.0.0' } });
    });

    expect(screen.getByText(/发现新版本 v1.0.0/i)).toBeInTheDocument();
    expect(screen.getByText('立即更新')).toBeInTheDocument();
    expect(screen.getByText('前往下载')).toBeInTheDocument();
  });

  it('should handle "start-download" action', () => {
    render(<UpdateNotifier />);
    const handleUpdate = mockIpcRenderer.on.mock.calls.find(call => call[0] === 'update-message')?.[1];

    act(() => {
      handleUpdate && handleUpdate({}, { type: 'available', info: { version: '1.0.0' } });
    });

    const updateBtn = screen.getByText('立即更新');
    fireEvent.click(updateBtn);
    expect(mockIpcRenderer.send).toHaveBeenCalledWith('start-download');
  });

  it('should handle "manual-download" action', () => {
    render(<UpdateNotifier />);
    const handleUpdate = mockIpcRenderer.on.mock.calls.find(call => call[0] === 'update-message')?.[1];

    act(() => {
      handleUpdate && handleUpdate({}, { type: 'available', info: { version: '1.0.0' } });
    });

    const manualBtn = screen.getByText('前往下载');
    fireEvent.click(manualBtn);
    expect(mockIpcRenderer.send).toHaveBeenCalledWith('open-download-link');
  });

  it('should update progress bar', () => {
    render(<UpdateNotifier />);
    const handleUpdate = mockIpcRenderer.on.mock.calls.find(call => call[0] === 'update-message')?.[1];

    act(() => {
      handleUpdate && handleUpdate({}, { type: 'progress', progress: { percent: 50.5 } });
    });

    expect(screen.getByText(/正在下载 50.5%/i)).toBeInTheDocument();
  });

  it('should show restart button when downloaded', () => {
    render(<UpdateNotifier />);
    const handleUpdate = mockIpcRenderer.on.mock.calls.find(call => call[0] === 'update-message')?.[1];

    act(() => {
      handleUpdate && handleUpdate({}, { type: 'downloaded' });
    });

    expect(screen.getByText(/下载完成，请重启安装/i)).toBeInTheDocument();
    
    const restartBtn = screen.getByText(/立即重启/i);
    expect(restartBtn).toBeInTheDocument();

    fireEvent.click(restartBtn);
    expect(mockIpcRenderer.send).toHaveBeenCalledWith('install-update');
  });
});
