
export interface ResponsePortfolioDto {
  name: string
  project: Project[]
  "3NGx21lNUmjVwy3DeRgW": string
}

export interface Project {
  description: string
  date: Date
  image: string[]
  title: string
  url: string
  name: string
  stack:string[]
}

export interface Date {
  type: string
  seconds: number
  nanoseconds: number
}
