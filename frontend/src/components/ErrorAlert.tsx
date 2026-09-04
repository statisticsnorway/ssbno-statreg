import { Alert, Heading, Link, Paragraph } from '@statisticsnorway/design-react'

export function ErrorAlert(props: Readonly<{ message: string[] }>) {
  return (
    <Alert data-color='danger' role='alert'>
      <Heading
        level={2}
        data-size='xs'
        style={{
          marginBottom: 'var(--ds-size-2)',
        }}
      >
        {'En feil har oppstått'}
      </Heading>
      <Paragraph>
        Noe gikk galt. Vennligst prøv på nytt, eller kontakt <Link href='mailto:desken@ssb.no'>desken</Link> dersom
        problemet vedvarer.
      </Paragraph>
      {props.message.length > 0 && (
        <Paragraph>
          <br />
          Teknisk feilmelding:
          <br />
          {props.message.join('. ')}
        </Paragraph>
      )}
    </Alert>
  )
}
