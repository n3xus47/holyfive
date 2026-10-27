(function () {
    var PARTIALS = {
        'header': 'partials/header.html',
        'footer': 'partials/footer.html'
    };

    function loadPartial(name) {
        var url = PARTIALS[name];
        if (!url) return Promise.reject(new Error('Unknown partial: ' + name));
        return fetch(url).then(function (res) {
            if (!res.ok) throw new Error('Failed to load ' + url);
            return res.text();
        });
    }

    function replacePlaceholder(placeholder, html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html.trim(), 'text/html');
        var root = doc.body.firstElementChild;
        if (root) {
            placeholder.replaceWith(root);
        }
    }

    function runIncludes() {
        var placeholders = document.querySelectorAll('[data-include]');
        if (!placeholders.length) {
            document.dispatchEvent(new Event('hfLayoutReady'));
            return;
        }
        var pending = Array.prototype.map.call(placeholders, function (el) {
            var name = el.getAttribute('data-include');
            return loadPartial(name).then(function (html) {
                replacePlaceholder(el, html);
            });
        });
        Promise.all(pending).then(function () {
            document.dispatchEvent(new Event('hfLayoutReady'));
        }).catch(function (err) {
            console.error('HF include error:', err);
            document.dispatchEvent(new Event('hfLayoutReady'));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runIncludes);
    } else {
        runIncludes();
    }
})();
