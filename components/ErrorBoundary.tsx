"use client";
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Произошла ошибка в компоненте:", error, errorInfo);
    // TODO: отправить логи в сервис аналитики
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
          <h1 className="text-5xl font-bold mb-4">Упс! Что-то пошло не так.</h1>
          <p className="mb-6 text-lg">Мы уже работаем над решением.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary px-6 py-3"
            aria-label="Перезагрузить страницу"
          >
            Перезагрузить страницу
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
