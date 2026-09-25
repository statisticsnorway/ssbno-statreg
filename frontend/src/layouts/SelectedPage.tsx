import { Children, cloneElement, type ReactElement } from 'react'
import { useLocation } from 'react-router'

type PageLink = ReactElement<{
  children: string
  className?: string
  'aria-current'?: 'page'
}>

const SelectedPage = ({ children }: { children: PageLink | PageLink[] }) => {
  const page = useLocation().pathname.split('/')[1] || 'publisering'

  return Children.map(children, (link) =>
    cloneElement(link, {
      className: 'header-menu-link',
      'aria-current': link.props.children.toLowerCase().startsWith(page) ? 'page' : undefined,
    })
  )
}

export default SelectedPage