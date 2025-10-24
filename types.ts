export interface Job {
  openFor: string;
  questions: any;
  createdAt: string | number | Date;
  _id: string;
  title: string;
  postedBy: {
    name: string;
    avatar: string;
  };
  location: string;
  type: string;
  isLGBT: boolean;
  tags: string[];
  numberOfParticipants: number;
  description: string;
  category: string;
  postedDate: string;
  withFriends: boolean;
  detailsFetched: boolean;
}

export interface Application {
  _id: string;
  resume: string | null;
  coverLetter: string | null;
  coverLetterVideo: string;
  applyFor: string;
  applyBy: {
    _id: string;
    email: string;
    phone: string;
    name: string;
    gender: string;
    avatar: string;
  };
  hiring: string;
  comment: string;
  badges: string[];
  customQuestionAnswers: string[];
  createdAt: string;
  updatedAt: string;
  detailsFetched: boolean;
}

export interface UserBasicInformation {
  name: string;
  bio: string;
  gender: string;
  dob: Date;
}
