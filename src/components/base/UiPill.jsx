import { Pill } from '@oro/ui'
import { colors, withAlpha } from '@oro/tokens'
import { useTheme } from '../../context/ThemeContext'

// @oro/ui Pill with landing theme awareness (color-only overrides on dark plum
// surfaces: cream outline chip, cream-filled when active).
export default function UiPill({ active = false, style, textStyle, ...props }) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  return (
    <Pill
      {...props}
      active={active}
      style={[
        dark &&
          (active
            ? { backgroundColor: colors.cream, borderColor: colors.cream }
            : { backgroundColor: 'transparent', borderColor: withAlpha(colors.paper, '4D') }),
        style,
      ]}
      textStyle={[dark && { color: active ? colors.plum : colors.paper }, textStyle]}
    />
  )
}
