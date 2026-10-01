import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// 이미지 로드 실패·WebGL 미지원 시 캐러셀 대신 안내 문구를 보여준다.
// 캐러셀 컴포넌트 자체에는 에러 경계가 없으므로 데모에서 감싼다
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="demo_error">
          <p>3D 화면을 표시할 수 없습니다: {this.state.error.message}</p>
          {/* 에러만 지우면 다시 렌더하며 이미지를 새로 불러온다 (실패한 로드는 캐시에 남지 않음) */}
          <button type="button" onClick={() => this.setState({ error: null })}>
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
