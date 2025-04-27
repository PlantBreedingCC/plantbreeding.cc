window.TEXT_SEARCH_DATA={
  {%- for _collection in site.collections -%}
    {%- unless forloop.first -%},{%- endunless -%}
    '{{ _collection.label }}':[
      {%- for _article in _collection.docs -%}
      {%- unless forloop.first -%},{%- endunless -%}
      {'title':{{ _article.title | jsonify }},
      'url': {%- if _article.pdf -%}
                  {{ _article.pdf | jsonify }}
               {%- else -%}
                  {%- include snippets/prepend-baseurl.html path=_article.url -%}
                  {%- assign _url = __return -%}
                  {{ _url | jsonify }}
               {%- endif -%}
      }
      {%- endfor -%}
    ]
  {%- endfor -%}
};