(function () {
  function resolveImg(path) {
    if (!path) return '';
    if (/^https?:\/\//.test(path)) return path;
    return path.charAt(0) === '/' ? path : '/' + path;
  }

  function excerpt(markdown, len) {
    if (!markdown) return '';
    var text = String(markdown).replace(/<[^>]+>/g, ' ').replace(/[#*_`>]/g, '').replace(/\s+/g, ' ').trim();
    return text.length > len ? text.slice(0, len).trim() + '…' : text;
  }

  var ProductsPreview = createClass({
    render: function () {
      var products = this.props.entry.getIn(['data', 'products']);
      if (!products || products.size === 0) {
        return h('div', { className: 'fs-preview fs-empty' }, 'No products yet — add one on the left.');
      }
      return h('div', { className: 'fs-preview' },
        h('div', { className: 'fs-preview-eyebrow' },
          products.size + ' product' + (products.size === 1 ? '' : 's') + ' — Syndicate'),
        h('div', { className: 'fs-preview-grid' },
          products.map(function (p, i) {
            var img = p.get('img');
            var badge = p.get('badge');
            var origPrice = p.get('originalPrice');
            return h('div', { className: 'fs-card', key: i },
              img
                ? h('div', {
                    className: 'fs-card-media',
                    style: { backgroundImage: 'url(' + resolveImg(img) + ')' }
                  }, badge ? h('span', { className: 'fs-badge fs-badge-' + badge }, badge) : null)
                : h('div', { className: 'fs-card-media fs-card-media-empty' }, 'No image'),
              h('div', { className: 'fs-card-body' },
                h('div', { className: 'fs-card-cat' }, p.get('category') || ''),
                h('div', { className: 'fs-card-name' }, p.get('name') || 'Untitled product'),
                h('div', { className: 'fs-card-price' },
                  h('span', {}, p.get('price') || ''),
                  origPrice ? h('span', { className: 'fs-card-price-orig' }, origPrice) : null
                )
              )
            );
          }).toArray()
        )
      );
    }
  });

  var BlogPreview = createClass({
    render: function () {
      var posts = this.props.entry.getIn(['data', 'posts']);
      if (!posts || posts.size === 0) {
        return h('div', { className: 'fs-preview fs-empty' }, 'No posts yet — add one on the left.');
      }
      return h('div', { className: 'fs-preview' },
        h('div', { className: 'fs-preview-eyebrow' },
          posts.size + ' post' + (posts.size === 1 ? '' : 's') + ' — Syndicate Journal'),
        h('div', { className: 'fs-blog-list' },
          posts.map(function (post, i) {
            var img = post.get('image');
            return h('article', { className: 'fs-blog-card', key: i },
              h('div', {
                className: 'fs-blog-media',
                style: img ? { backgroundImage: 'url(' + resolveImg(img) + ')' } : {}
              }),
              h('div', { className: 'fs-blog-body' },
                h('div', { className: 'fs-blog-cat' }, post.get('category') || ''),
                h('h3', { className: 'fs-blog-title' }, post.get('title') || 'Untitled post'),
                h('div', { className: 'fs-blog-date' }, post.get('date') || ''),
                h('div', { className: 'fs-blog-excerpt' }, excerpt(post.get('body'), 140))
              )
            );
          }).toArray()
        )
      );
    }
  });

  CMS.registerPreviewStyle(
    'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;700;900&family=Inter:wght@400;500;600&display=swap'
  );
  CMS.registerPreviewStyle('preview.css');

  CMS.registerPreviewTemplate('syndicate-products', ProductsPreview);
  CMS.registerPreviewTemplate('syndicate-blog', BlogPreview);
})();
