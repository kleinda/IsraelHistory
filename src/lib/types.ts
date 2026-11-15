export type CategoryId =
  | 'politics'
  | 'military'
  | 'terror'
  | 'affair'
  | 'peace'
  | 'aliyah'
  | 'economy'
  | 'society'
  | 'culture'
  | 'science'
  | 'disaster'
  | 'shoah';

/** "YYYY-MM-DD" | "YYYY-MM" | "YYYY" */
export type HDate = string;

export interface HistEvent {
  id: string;
  date: HDate;
  title: string;
  summary: string;
  body: string[];
  category: CategoryId;
  /** Secondary categories: the event also shows up when filtering by these. */
  also?: CategoryId[];
  importance: 1 | 2 | 3;
  people?: string[];
  related?: string[];
  /** English Wikipedia article title, used for the lead image and the "read more" link */
  wiki?: string;
}

export interface War {
  id: string;
  name: string;
  start: HDate;
  end: HDate;
  summary: string;
  body: string[];
  people?: string[];
  wiki?: string;
}

export interface Government {
  id: string;
  number: number | null;
  pm: string;
  pmName: string;
  party: string;
  start: HDate;
  /** null while the government is still serving */
  end: HDate | null;
  color: string;
  note?: string;
}

export interface President {
  id: string;
  /** Link to people.json; acting presidents (Knesset speakers) have none */
  person?: string;
  name: string;
  start: HDate;
  end: HDate | null;
  acting?: boolean;
  note?: string;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  aliases?: string[];
  wiki?: string;
}

export interface WikiImage {
  src?: string;
  page?: string;
  heTitle?: string;
  enTitle: string;
}

export type Route =
  | { type: 'home' }
  | { type: 'leaders' }
  | { type: 'event' | 'war' | 'gov' | 'person'; id: string };
