export interface SeriesListItem {
  seriesId: string
  title: string
  sessionCount: number
  totalRegistrations: number
  totalAttendees: number
  uniqueAccountsInfluenced: number
  createdAt: string
  updatedAt: string
}

export interface SeriesResponse {
  seriesId: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface SessionListItem {
  sessionId: string
  title: string
  startsAt: string
  endsAt: string
  totalRegistrations: number
  totalAttendees: number
  ownerDisplayName: string
}

export interface SessionResponse {
  sessionId: string
  seriesId: string
  title: string
  startsAt: string
  endsAt: string
}

export interface SeriesMetricsResponse {
  seriesId: string
  totalRegistrations: number
  totalAttendees: number
  uniqueRegistrantAccountDomains: number
  uniqueAccountsInfluenced: number
  warmAccounts: { accountDomain: string; warmRule: 'W1' | 'W2' }[]
}

export interface SessionMetricsResponse {
  sessionId: string
  totalRegistrations: number
  totalAttendees: number
  uniqueRegistrantAccountDomains: number
  uniqueAttendeeAccountDomains: number
  warmAccountsTriggered: string[]
}
