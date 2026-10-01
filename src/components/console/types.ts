export type ConsoleTab =
  | 'overview'
  | 'listings'
  | 'vault'
  | 'sales'
  | 'collabs'
  | 'messages'
  | 'settings';

export interface ConsoleCounts {
  unreadMessages: number;
  pendingPitches: number;
}
