export const ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const GAME_STATUS = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  FINISHED: "FINISHED",
} as const;

export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS];
