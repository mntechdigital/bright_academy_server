export interface INotice {
  id: string;
  title: string;
  pdfUrl: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateNoticePayload {
  title: string;
  pdfUrl: string;
}

export interface IUpdateNoticePayload {
  title?: string;
  pdfUrl?: string;
  isPublished?: boolean;
}
