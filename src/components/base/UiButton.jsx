import { Button } from '@oro/ui'
import { colors } from '@oro/tokens'
import { useTheme } from '../../context/ThemeContext'

// @oro/ui Button with landing theme awareness. The design system's palette is
// light-surface (plum button on cream); on the landing's dark plum surfaces a
// plum button would vanish, so `invertOnDark` flips to cream-on-plum — a
// color-only override (shape/type stay canonical @oro/ui).
export default function UiButton({ invertOnDark = false, style, textStyle, ...props }) {
  const { theme } = useTheme()
  const invert = invertOnDark && theme === 'dark'
  return (
    <Button
      {...props}
      style={[invert && { backgroundColor: colors.cream }, style]}
      textStyle={[invert && { color: colors.plum }, textStyle]}
    />
  )
}
