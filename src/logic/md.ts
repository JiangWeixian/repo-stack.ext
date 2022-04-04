import markdownIt from 'markdown-it'

export const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
})
