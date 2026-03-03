import React from 'react';
import SearchBarOriginal from '@theme-original/SearchBar';

type SearchBarProps = React.ComponentProps<typeof SearchBarOriginal>;

export default function SearchBar(props: SearchBarProps): React.ReactElement {
  return <SearchBarOriginal {...props} />;
}
