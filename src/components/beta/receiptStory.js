import mascot from '../../assets/mascot/cheeky.webp'

export async function createReceiptStory(signupNumber) {
  const image = new Image()
  image.src = mascot
  const logo = new Image()
  logo.src = '/oro-logo.webp'
  await Promise.all([image.decode(), logo.decode()])

  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Image creation is unavailable in this browser.')

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920)
  gradient.addColorStop(0, '#fffdf7')
  gradient.addColorStop(1, '#eee5ff')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1080, 1920)

  ctx.fillStyle = '#2b1646'
  const title = Number.isSafeInteger(signupNumber) && signupNumber > 0 ? `i’m #${signupNumber}` : 'i’m'
  let titleSize = 150
  ctx.font = `bold ${titleSize}px Georgia, serif`
  while (ctx.measureText(title).width > 928 && titleSize > 80) {
    titleSize -= 2
    ctx.font = `bold ${titleSize}px Georgia, serif`
  }
  ctx.fillText(title, 76, 230, 928)
  ctx.font = 'bold 150px Georgia, serif'
  ctx.fillText('in line', 76, 385)
  ctx.fillText('to meet oro', 76, 540, 928)

  ctx.drawImage(image, 260, 590, 720, 720)

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(64, 1360, 952, 390, 40)
  ctx.fill()
  ctx.fillStyle = '#2b1646'
  ctx.font = 'bold 72px Georgia, serif'
  ctx.fillText('want her number?', 118, 1470)
  ctx.font = '44px Arial, sans-serif'
  ctx.fillText('dm me for my invite.', 118, 1545)
  ctx.fillStyle = '#49346c'
  ctx.font = '36px Arial, sans-serif'
  ctx.fillText('your personal ai stylist,', 118, 1635)
  ctx.fillText('right in your texts.', 118, 1685)
  ctx.drawImage(logo, 70, 1780, 180, 101)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('The story image could not be created.')
  return blob
}

export function downloadReceiptStory(blob) {
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = 'oro-invite-story.png'
  link.click()
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000)
}
