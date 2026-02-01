import { Link } from 'react-router-dom';
import { articles } from '../data';

export function ArticlesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Articles</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={/articles/}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700"
          >
            <div className="text-xs text-slate-500">{article.category}</div>
            <div className="text-white font-medium mt-2">{article.title}</div>
            <div className="text-slate-400 text-sm mt-2">{article.excerpt}</div>
            <div className="text-xs text-slate-500 mt-3">{article.date}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
