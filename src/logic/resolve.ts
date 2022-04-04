import GitUrlParse from 'git-url-parse'

export const resolveRepo = (url: string) => {
  const result = GitUrlParse(url)
  return result
}
