/**
 * 错误状态组件
 * 根据错误码显示差异化提示
 */

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Refresh01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  NoInternetIcon,
  LockIcon,
  Key02Icon,
  FileXIcon,
  FolderOpenIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ErrorCode, ERROR_MESSAGES, type AppError } from "@/types/error";

interface ErrorStateProps {
  error: AppError | Error | string;
  onRetry?: () => void;
  className?: string;
}

const errorIcons: Partial<Record<ErrorCode, React.ReactNode>> = {
  [ErrorCode.NETWORK_LOST]: <HugeiconsIcon icon={NoInternetIcon} className="size-8" />,
  [ErrorCode.AUTH_FAILED]: <HugeiconsIcon icon={Key02Icon} className="size-8" />,
  [ErrorCode.PERMISSION_DENIED]: <HugeiconsIcon icon={LockIcon} className="size-8" />,
  [ErrorCode.NOT_FOUND]: <HugeiconsIcon icon={FileXIcon} className="size-8" />,
  [ErrorCode.DIR_NOT_EMPTY]: <HugeiconsIcon icon={FolderOpenIcon} className="size-8" />,
};

function parseError(error: AppError | Error | string): AppError {
  if (typeof error === "string") {
    return {
      code: ErrorCode.UNKNOWN,
      message: error,
      retryable: true,
    };
  }

  if ("code" in error && Object.values(ErrorCode).includes(error.code)) {
    return error;
  }

  return {
    code: ErrorCode.UNKNOWN,
    message: error.message || "An unknown error occurred",
    retryable: true,
  };
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  const [detailExpanded, setDetailExpanded] = useState(false);
  const appError = parseError(error);

  const friendlyMessage = ERROR_MESSAGES[appError.code] || appError.message;

  const icon = errorIcons[appError.code] || (
    <HugeiconsIcon icon={AlertCircleIcon} className="size-8" />
  );

  const showRetry = appError.retryable && onRetry;
  const hasDetail = appError.detail && appError.detail.length > 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-4 py-8 text-center",
        className
      )}
      role="alert"
    >
      <div className="text-destructive">{icon}</div>

      <div className="space-y-1">
        <p className="text-foreground text-sm font-medium">{friendlyMessage}</p>
        {appError.message !== friendlyMessage && (
          <p
            className="text-muted-foreground max-w-[300px] truncate text-xs"
            title={appError.message}
          >
            {appError.message.length > 100
              ? `${appError.message.slice(0, 100)}...`
              : appError.message}
          </p>
        )}
      </div>

      {hasDetail && (
        <div className="w-full max-w-[400px]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetailExpanded(!detailExpanded)}
            className="text-muted-foreground hover:text-foreground mx-auto h-auto gap-1 py-1 text-xs"
          >
            {detailExpanded ? (
              <>
                Hide details <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" />
              </>
            ) : (
              <>
                Show details <HugeiconsIcon icon={ArrowDown01Icon} className="size-3" />
              </>
            )}
          </Button>
          {detailExpanded && (
            <pre className="bg-muted mt-2 max-h-[150px] overflow-auto rounded-md p-3 text-left text-xs">
              {appError.detail}
            </pre>
          )}
        </div>
      )}

      {showRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <HugeiconsIcon icon={Refresh01Icon} className="size-4" />
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * 行内错误提示
 */
interface InlineErrorProps {
  message: string;
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <div className={cn("text-destructive flex items-center gap-2 text-sm", className)} role="alert">
      <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
