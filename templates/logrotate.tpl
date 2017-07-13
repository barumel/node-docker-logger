{logdir}/*/*.log {
  {interval}
  rotate {rotate}
  size={size}
  dateext
  compress
  delaycompress
  missingok
  notifempty
  sharedscripts
}
