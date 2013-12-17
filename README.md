This is a simple MeteorJS app which lets you:

- Export raw data from Mixpanel into a txt file of events (represented by JSON objects)
  - See here for more on Mixpanel's data export format
- Split files into smaller chunks for re-uploading
- Import data to a Mixpanel project

It doesn't like big files with lots of events in them. I've found that limiting the amount of events in a file to at most 40,000 seems to be ok. YMMV.