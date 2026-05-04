import React from 'react'

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-4">
        Welcome to your <span className="text-primary-600">E-commerce Store</span>
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mb-8">
        Your structure is ready. Start building your premium shopping experience here.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {['Featured Products', 'New Arrivals', 'Special Offers'].map((item) => (
          <div key={item} className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-2">{item}</h3>
            <p className="text-slate-500">Explore our curated collection of {item.toLowerCase()}.</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home
