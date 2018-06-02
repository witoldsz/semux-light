import { h } from 'hyperapp'

export function GithubRibbon() {
  return <a href="https://github.com/witoldsz/semux-light" target="_blank">
    <img style={{
      position: 'absolute',
      top: '0',
      right: '0',
      border: '0',
      }}
      src="https://s3.amazonaws.com/github/ribbons/forkme_right_orange_ff7600.png"
      alt="Fork me on GitHub"
    />
  </a>
}
