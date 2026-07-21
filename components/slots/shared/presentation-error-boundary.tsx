"use client";

import { Component, type ReactNode } from "react";

export class PresentationErrorBoundary extends Component<
  {
    children: ReactNode;
    resetKey: string;
    onRecover: (error: Error) => void;
  },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onRecover(error);
  }

  componentDidUpdate(previous: Readonly<{ resetKey: string }>) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey)
      this.setState({ failed: false });
  }

  render() {
    if (this.state.failed)
      return (
        <div className="slot-presentation-recovery" role="status">
          Анимация была восстановлена
        </div>
      );
    return this.props.children;
  }
}
