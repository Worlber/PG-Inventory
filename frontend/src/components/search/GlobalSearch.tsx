import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Box,
  InputAdornment,
  ClickAwayListener,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { inventoryApi } from '../../api/inventory';
import { SearchResult } from '../../types';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await inventoryApi.search(query);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    navigate(`/instances/${result.id}`);
  };

  const typeColor: Record<string, 'primary' | 'secondary' | 'info'> = {
    instance: 'primary',
    database: 'secondary',
    user: 'info',
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: 'relative' }}>
        <TextField
          size="small"
          placeholder="Search hostname, database, user..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#F5F7F5',
            },
          }}
        />
        {open && results.length > 0 && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 0.5,
              maxHeight: 400,
              overflow: 'auto',
              zIndex: 1300,
            }}
          >
            <List dense>
              {results.map((r, i) => (
                <ListItemButton key={`${r.type}-${r.id}-${i}`} onClick={() => handleSelect(r)}>
                  <Chip
                    label={r.type}
                    size="small"
                    color={typeColor[r.type] || 'default'}
                    sx={{ mr: 1, minWidth: 70 }}
                  />
                  <ListItemText
                    primary={r.label}
                    secondary={r.detail}
                    primaryTypographyProps={{ fontSize: '0.9rem' }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}
        {open && query.length >= 2 && results.length === 0 && (
          <Paper
            elevation={4}
            sx={{ position: 'absolute', top: '100%', left: 0, right: 0, mt: 0.5, p: 2, zIndex: 1300 }}
          >
            <Typography variant="body2" color="text.secondary">
              No results found.
            </Typography>
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
