/**
 * File Type Icon Component
 */

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  File01Icon,
  FileCodeIcon,
  File02Icon,
  FileImageIcon,
  FileZipIcon,
  FileAudioIcon,
  FileVideoIcon,
  Folder01Icon,
} from "@hugeicons/core-free-icons";

import { getFileType, type FileType } from "@/lib/file";
import type { FileEntry } from "@/types";
import { cn } from "@/lib/utils";

interface FileIconProps {
  file: FileEntry;
  className?: string;
}

const iconMap: Record<FileType, IconSvgElement> = {
  folder: Folder01Icon,
  code: FileCodeIcon,
  document: File02Icon,
  image: FileImageIcon,
  archive: FileZipIcon,
  audio: FileAudioIcon,
  video: FileVideoIcon,
  other: File01Icon,
};

const colorMap: Record<FileType, string> = {
  folder: "text-file-folder",
  code: "text-file-code",
  document: "text-file-document",
  image: "text-file-image",
  archive: "text-file-archive",
  audio: "text-file-audio",
  video: "text-file-video",
  other: "text-muted-foreground",
};

export function FileIcon({ file, className }: FileIconProps) {
  const fileType = getFileType(file);
  const icon = iconMap[fileType];
  const colorClass = colorMap[fileType];

  return <HugeiconsIcon icon={icon} className={cn("size-4", colorClass, className)} />;
}
