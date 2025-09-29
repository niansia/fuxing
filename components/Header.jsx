import React from 'react';

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">
            花蓮光復鄉 互助支援平台
          </h1>
          <p className="mt-2 text-md text-slate-600">
            整合需求，集中資源，讓我們一起度過難關。
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
