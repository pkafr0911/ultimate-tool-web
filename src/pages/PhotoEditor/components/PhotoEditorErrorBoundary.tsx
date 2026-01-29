import React, { Component, ReactNode } from 'react';
import { Result, Button, Typography } from 'antd';
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class PhotoEditorErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console
    console.error('PhotoEditor Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle="An error occurred in the Photo Editor. You can try to recover or reload the page."
          icon={<WarningOutlined style={{ color: '#ff4d4f' }} />}
          extra={[
            <Button key="retry" type="primary" onClick={this.handleReset}>
              Try Again
            </Button>,
            <Button key="reload" icon={<ReloadOutlined />} onClick={this.handleReload}>
              Reload Page
            </Button>,
          ]}
        >
          <div style={{ textAlign: 'left' }}>
            <Paragraph>
              <Text strong style={{ fontSize: 16 }}>
                Error Details:
              </Text>
            </Paragraph>
            <Paragraph>
              <Text code>{this.state.error?.message || 'Unknown error'}</Text>
            </Paragraph>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <>
                <Paragraph>
                  <Text strong>Component Stack:</Text>
                </Paragraph>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4,
                    overflow: 'auto',
                    maxHeight: 200,
                    fontSize: 12,
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
        </Result>
      );
    }

    return this.props.children;
  }
}

export default PhotoEditorErrorBoundary;
