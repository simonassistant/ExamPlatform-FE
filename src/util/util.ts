import { AxiosError } from 'axios';

export interface Dictionary<T> {
  [key: string]: T;
}

export function getErrorMessage(e: unknown): string {
  let errorMessage: string;
  if (e instanceof AxiosError) {
    if (e.response) {
      // 服务器已回应，且状态码不在 2xx 范围内
      console.error('Error status:', e.response.status);
      console.error('Error data:', e.response.data);
      errorMessage = e.response.data.detail;
    } else if (e.request) {
      // 请求已发出，但未得到回应
      console.error('No response received:', e.request);
      errorMessage = 'Server not respond!';
    } else {
      // 其它错误
      console.error('Error message:', e.message);
      errorMessage = 'Unexpected error, please contact admin!';
    }
  } else if (e instanceof Error) {
    errorMessage = e.message;
  } else if (typeof e === "string") {
    errorMessage = e;
  } else {
    console.error("Unknown error type");
    errorMessage = String(e);
  }
  console.error(errorMessage);
  return errorMessage;
}

export function formatDuration(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const days = Math.floor(totalSeconds / 86400);
  const remainderAfterDays = totalSeconds % 86400;
  const hours = Math.floor(remainderAfterDays / 3600);
  const remainderAfterHours = remainderAfterDays % 3600;
  const minutes = Math.floor(remainderAfterHours / 60);
  const secs = remainderAfterHours % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${days==0 ? '':days} ${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}
