import Dexie, { type Table } from 'dexie'

export interface Category {
  id?: number
  name: string
  description: string
  icon: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface Question {
  id?: number
  categoryId: number
  imageData: Blob
  imageName: string
  imageSize: number
  imageType: string
  correctAnswer: string
  myAnswer: string
  notes: string
  isMastered: boolean
  masteredAt: Date | null
  wrongCount: number
  createdAt: Date
  updatedAt: Date
}

export interface QuizSession {
  id?: number
  startedAt: Date
  completedAt: Date | null
  finishedCount: number
  totalCount: number
  correctCount: number
  isAbandoned: boolean
}

export interface QuizAnswer {
  id?: number
  sessionId: number
  questionId: number
  userAnswer: string
  isCorrect: boolean
  answeredAt: Date
  timeSpent: number
}

class MistakeBookDB extends Dexie {
  categories!: Table<Category, number>
  questions!: Table<Question, number>
  quizSessions!: Table<QuizSession, number>
  quizAnswers!: Table<QuizAnswer, number>

  constructor() {
    super('MistakeBookDB')
    this.version(1).stores({
      categories: '++id, name, sortOrder, createdAt',
      questions: '++id, categoryId, isMastered, createdAt, updatedAt',
      quizSessions: '++id, startedAt',
      quizAnswers: '++id, sessionId, questionId, answeredAt'
    })
  }
}

export const db = new MistakeBookDB()
