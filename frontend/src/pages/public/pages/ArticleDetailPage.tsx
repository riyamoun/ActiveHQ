import { useParams, Link } from 'react-router-dom';
import { articles } from '../data';

export function ArticleDetailPage() {
  const { id } = useParams();
  const article = articles.find((a) => a.id === id);

  if (!article) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <p className="text-slate-400">Article not found.</p>
        <Link to="/articles" className="text-emerald-400">Back to articles</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-xs text-slate-500">{article.category}</div>
      <h1 className="text-2xl font-semibold mt-2">{article.title}</h1>
      <div className="text-slate-500 text-sm mt-2">{article.date}</div>
      <div className="mt-6 text-slate-300 text-sm leading-relaxed">
        <p>{article.excerpt}</p>
        <p className="mt-4">
          This is a short operational guide for gym owners in India. Keep tracking attendance,
          follow up on renewals early, and close payments daily to avoid leaks.
        </p>
      </div>
      <Link to="/articles" className="inline-block mt-6 text-emerald-400">
        Back to articles
      </Link>
    </div>
  );
}
