import { ZodIssue } from 'zod'
import { Field, fieldErrors } from './field'

type ErrorsProps = {
  /**
   * The field to show errors for.
   *
   * @example
   * <Errors field={fields.myField} />
   */
  field: Field
  /** The number of errors to show. By default, all errors will be shown comma separated. */
  max?: number
  /**
   * Change the data displayed for an issue.
   *
   * @default
   * issue => issue.message
   *
   * @example
   * <Errors field={fields.myField} issueMap={issue => `${issue.message} (${issue.code})`} />
   */
  issueMap?: (issue: ZodIssue) => string
  /** Separator between each issue. Default: `, ` */
  separator?: string
} & React.ComponentProps<'span'>

/**
 * Render a `span` with a comma separated list of errors for a particular field.
 *
 * @example
 * <Errors field={fields.myField} />
 *
 * @example Show errors for entire field
 * <Errors field={fields} />
 */
export const Errors = ({ field, max, issueMap, separator, ...props }: ErrorsProps) => {
  // Get errors for the field
  const errors = fieldErrors(field)

  if (errors.length === 0) return null

  return <span {...props}>{errors.map(issueMap ?? (issue => issue.message)).slice(0, max).join(separator ?? ', ')}</span>
}
