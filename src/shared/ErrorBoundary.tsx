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
        <p role="alert" className="demo_error">
          3D 화면을 표시할 수 없습니다: {this.state.error.message}
        </p>
      );
    }
    return this.props.children;
  }
}
