/**
 * MuiDataDisplay – Chips, Avatars, Badges and a sortable Table.
 *
 * Chips can be clickable or deletable, Badges sit on top of any child, and
 * the Table is made of the same parts as an HTML table (TableHead, TableRow,
 * TableCell…). TableSortLabel draws the sort arrow – the sorting is ours.
 */
import { useState } from 'react';
import {
  Avatar,
  AvatarGroup,
  Badge,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material';
import { Bell, GraduationCap, Mail } from 'lucide-react';
import { students } from '../../../data/students.js';

const INITIAL_SKILLS = ['React', 'Python', 'FastAPI', 'scikit-learn', 'Git'];
const rows = students.slice(0, 6);

export default function MuiDataDisplay() {
  const [skills, setSkills] = useState(INITIAL_SKILLS);
  const [filter, setFilter] = useState('All');
  const [order, setOrder] = useState('desc'); // sort by score

  const sortedRows = [...rows].sort((a, b) => (order === 'asc' ? a.score - b.score : b.score - a.score));

  return (
    <Stack spacing={3}>
      {/* Chips: filter chips (clickable) and deletable chips */}
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {['All', 'Hawthorn', 'Sarawak', 'Online'].map((campus) => (
          <Chip
            key={campus}
            label={campus}
            color={filter === campus ? 'primary' : 'default'}
            variant={filter === campus ? 'filled' : 'outlined'}
            onClick={() => setFilter(campus)}
          />
        ))}
      </Stack>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {skills.map((skill) => (
          <Chip key={skill} label={skill} onDelete={() => setSkills(skills.filter((s) => s !== skill))} />
        ))}
        <Chip icon={<GraduationCap size={16} />} label="Year 3" color="success" variant="outlined" />
        {skills.length < INITIAL_SKILLS.length && (
          <Chip label="Reset" variant="outlined" onClick={() => setSkills(INITIAL_SKILLS)} />
        )}
      </Stack>

      {/* Avatars and badges */}
      <Stack direction="row" spacing={3} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <AvatarGroup max={4}>
          {rows.map((s) => (
            <Avatar key={s.id} alt={`${s.firstName} ${s.lastName}`}>
              {s.firstName[0]}
              {s.lastName[0]}
            </Avatar>
          ))}
        </AvatarGroup>
        <Avatar alt="Profile photo" src="https://picsum.photos/seed/avatar-tutor/80/80" />
        <Badge badgeContent={4} color="error" overlap="circular">
          <IconButton aria-label="4 new notifications">
            <Bell size={20} />
          </IconButton>
        </Badge>
        <Badge variant="dot" color="success" overlap="circular">
          <IconButton aria-label="Messages (new)">
            <Mail size={20} />
          </IconButton>
        </Badge>
      </Stack>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label="Students and scores">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Major</TableCell>
              <TableCell align="right" sortDirection={order}>
                <TableSortLabel active direction={order} onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}>
                  Score
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows
              .filter((s) => filter === 'All' || s.campus === filter)
              .map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell component="th" scope="row">
                    {s.firstName} {s.lastName}
                  </TableCell>
                  <TableCell>{s.major}</TableCell>
                  <TableCell align="right">{s.score}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={s.status}
                      color={s.status === 'At risk' ? 'warning' : 'success'}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
