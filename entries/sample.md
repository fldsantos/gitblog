---
title: "Sample Blog Entry"
date: 2024-01-01
tags: [Sample, Entry]
author: 
---

# The title should be the first line in the '#' symbol

This paragraph introduces the article. Markdown allows you to write using an easy-to-read, easy-to-write plain text format, which then converts to valid HTML. Below are examples of the formatting available to you.

## Text Formatting

You can make text **bold** (using double asterisks) or *italic* (using single asterisks). If you need to be emphatic, you can even do ***both***. 

You can also use:
* ~~Strikethrough~~ for deleted text.
* `Inline code` for technical terms.
* [Hyperlinks](https://www.example.com) to external sites.

---

## Lists

Markdown supports various types of lists.

### Unordered Lists
* Item 1
* Item 2
    * Indented Item 2a
    * Indented Item 2b
* Item 3

### Ordered Lists
1.  First step
2.  Second step
3.  Third step

### Task Lists
- [x] Write the post
- [ ] Publish the post
- [ ] Share on social media

---

## Code Blocks

For longer snippets of code, you can use three backticks or three tildes (fence) and specify the language for syntax highlighting.

~~~javascript
// A simple Node.js example
const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
~~~

## Blockquotes

Use the `>` character to create blockquotes. These are great for highlighting notes or quoting external sources.

> "The details are not the details. They make the design."
>
> — *Charles Eames*

## Tables

Tables are created using pipes `|` and hyphens `-`. You can align text using colons `:`.

| Feature | Syntax | Output |
| :--- | :---: | ---: |
| Left Aligned | `:---` | Left |
| Center Aligned | `:---:` | Center |
| Right Aligned | `---:` | Right |

## Images

Images are similar to links but start with an exclamation mark.

![Alt Text for Image](https://placehold.co/600x200?text=Hello+World)

## Conclusion

This concludes the sample entry. You can separate sections with horizontal rules like the one below.

---

*Thanks for reading!*