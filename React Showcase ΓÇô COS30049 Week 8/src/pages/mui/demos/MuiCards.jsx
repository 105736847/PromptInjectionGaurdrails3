/**
 * MuiCards – a Card is built from small parts:
 * CardHeader (avatar, title, action) → CardMedia (image) → CardContent (text)
 * → CardActions (buttons). Use only the parts you need.
 */
import { useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { Bookmark, EllipsisVertical, Image as ImageIcon, Share2 } from 'lucide-react';

const EVENTS = [
  {
    id: 1,
    title: 'Hackathon: AI for Good',
    date: 'Friday 10 Oct · 9am',
    image: 'https://picsum.photos/seed/hackathon/600/320',
    text: 'Build a prototype in 24 hours with a team of four. Mentors from industry will be around all day.',
    tag: 'Competition',
  },
  {
    id: 2,
    title: 'Workshop: Deploying FastAPI',
    date: 'Wednesday 15 Oct · 2pm',
    image: 'https://picsum.photos/seed/workshop/600/320',
    text: 'From uvicorn on your laptop to a server on the internet – bring your Assignment 3 back-end.',
    tag: 'Workshop',
  },
];

function EventCard({ event }) {
  const [saved, setSaved] = useState(false);

  return (
    <Card variant="outlined" sx={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{event.title[0]}</Avatar>}
        title={event.title}
        subheader={event.date}
        action={
          <IconButton aria-label={`More options for ${event.title}`}>
            <EllipsisVertical size={18} />
          </IconButton>
        }
      />
      <CardMedia component="img" height="160" image={event.image} alt="" loading="lazy" />
      <CardContent sx={{ flexGrow: 1 }}>
        <Chip label={event.tag} size="small" sx={{ mb: 1 }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {event.text}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" variant="contained">
          Register
        </Button>
        <IconButton
          aria-label={saved ? 'Remove bookmark' : 'Bookmark'}
          aria-pressed={saved}
          onClick={() => setSaved(!saved)}
          color={saved ? 'primary' : 'default'}
          sx={{ ml: 'auto' }} // push this and the next button to the right
        >
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </IconButton>
        <IconButton aria-label="Share">
          <Share2 size={18} />
        </IconButton>
      </CardActions>
    </Card>
  );
}

export default function MuiCards() {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {EVENTS.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </Stack>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <ImageIcon size={14} aria-hidden="true" /> Photos: picsum.photos (random placeholder images)
      </Typography>
    </Stack>
  );
}
