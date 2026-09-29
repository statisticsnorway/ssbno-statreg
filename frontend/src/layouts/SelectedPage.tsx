import { Children, cloneElement, type ReactElement } from 'react'
import { useLocation } from 'react-router'

type PageLink = ReactElement<{
  children: string
  className?: string
  'aria-current'?: 'page'
}>

const SelectedPage = ({ children }: { children: PageLink[] }) => {
  const activePage = useLocation().pathname.split('/')[1] || 'publisering'

  return Children.map(children, (link) => {
    const selected = link.props.children.toLowerCase().startsWith(activePage)

    return cloneElement(link, {
      className: 'header-menu-link',
      'aria-current': selected ? 'page' : undefined,
    })
  })
}

export default SelectedPage