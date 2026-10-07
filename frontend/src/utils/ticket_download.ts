import QRCode from 'qrcode';

export type TicketImageData = {
  code: string;
  eventName: string;
  date: string;
  location: string;
};

const WIDTH = 640;
const HEIGHT = 830;
const PADDING = 48;
const HEADER_HEIGHT = 220;
const QR_SIZE = 340;

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const lines: string[] = [];
  let line = '';

  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;

    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  lines.push(line);

  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, '')}…`;
  }

  return lines;
}

async function drawTicket({
  code,
  eventName,
  date,
  location,
}: TicketImageData) {
  const styles = getComputedStyle(document.documentElement);
  const color = (token: string) => styles.getPropertyValue(token).trim();
  // Nome real da DM Sans gerado pelo next/font, para o canvas usar a mesma fonte do site
  const fontFamily = getComputedStyle(document.body).fontFamily;
  const font = (weight: number, size: number) =>
    `${weight} ${size}px ${fontFamily}`;

  const canvas = document.createElement('canvas');
  // Dobro da resolução para o QR ficar nítido em telas de alta densidade
  canvas.width = WIDTH * 2;
  canvas.height = HEIGHT * 2;
  const context = canvas.getContext('2d')!;
  context.scale(2, 2);

  context.fillStyle = color('--card');
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = color('--primary');
  context.fillRect(0, 0, WIDTH, HEADER_HEIGHT);

  context.textBaseline = 'top';
  context.fillStyle = color('--secondary');
  context.font = font(700, 16);
  context.fillText('GOLDEN EVENTS · INGRESSO', PADDING, PADDING);

  context.fillStyle = color('--primary-foreground');
  context.font = font(900, 38);
  wrapText(context, eventName, WIDTH - PADDING * 2, 2).forEach((line, index) =>
    context.fillText(line, PADDING, PADDING + 40 + index * 46),
  );

  context.fillStyle = color('--foreground');
  context.font = font(700, 20);
  context.fillText(date, PADDING, HEADER_HEIGHT + 36);

  context.fillStyle = color('--muted-foreground');
  context.font = font(400, 18);
  wrapText(context, location, WIDTH - PADDING * 2, 1).forEach((line) =>
    context.fillText(line, PADDING, HEADER_HEIGHT + 68),
  );

  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, code, {
    width: QR_SIZE * 2,
    margin: 1,
    color: { dark: color('--foreground'), light: color('--card') },
  });
  const qrTop = HEADER_HEIGHT + 130;
  context.drawImage(qr, (WIDTH - QR_SIZE) / 2, qrTop, QR_SIZE, QR_SIZE);

  context.textAlign = 'center';
  context.fillStyle = color('--foreground');
  context.font = font(900, 30);
  context.fillText(code, WIDTH / 2, qrTop + QR_SIZE + 28);

  context.fillStyle = color('--muted-foreground');
  context.font = font(400, 16);
  context.fillText(
    'Apresente este QR code na entrada do evento.',
    WIDTH / 2,
    qrTop + QR_SIZE + 74,
  );

  return canvas;
}

export async function downloadTicketImage(ticket: TicketImageData) {
  const canvas = await drawTicket(ticket);
  const link = document.createElement('a');

  link.href = canvas.toDataURL('image/png');
  link.download = `ingresso-${ticket.code}.png`;
  link.click();
}
