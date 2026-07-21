import { useState } from 'react';
import Header from '../components/layout/Header';
import Hero from '../components/home/Hero';
import QueryCards from '../components/home/QueryCards';
import GallerySection from '../components/home/GallerySection';
import GalleryModal from '../components/home/GalleryModal';
import PublicacionesSection from '../components/home/PublicacionesSection';
import PostModal from '../components/home/PostModal';
import VideosSection from '../components/home/VideosSection';
import SurveyFloat from '../components/home/SurveyFloat';
import EditFab from '../components/home/EditFab';
import WelcomeFooter from '../components/home/WelcomeFooter';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [galleryState, setGalleryState] = useState({ item: null, items: [], index: 0 });
  const [postItem, setPostItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { puedeEditar } = useAuth();

  const openGalleryItem = (item, items = [], index = 0) => setGalleryState({ item, items, index });
  const navigateGallery = (item, index) => setGalleryState((prev) => ({ ...prev, item, index }));
  const closeGallery = () => setGalleryState({ item: null, items: [], index: 0 });

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-dark-bg dark:text-gray-100 min-h-screen font-sans antialiased pb-24 transition-colors">
      <Header />

      <SurveyFloat />

      <main className="w-full max-w-6xl mx-auto pt-16 md:pt-20 pb-10 px-4 md:px-6">
        <div className="space-y-6">
          <div className="reveal-section reveal-1">
            <Hero />
          </div>
          <div className="reveal-section reveal-2">
            <QueryCards />
          </div>
          <div className="reveal-section reveal-3">
            <GallerySection key={`gallery-${refreshKey}`} onOpenItem={openGalleryItem} />
          </div>
          <div className="reveal-section reveal-4">
            <VideosSection />
          </div>
          <div className="reveal-section reveal-5">
            <PublicacionesSection key={`posts-${refreshKey}`} onOpenItem={setPostItem} />
          </div>
        </div>

        <div className="reveal-section reveal-5">
          <WelcomeFooter />
        </div>
      </main>

      {puedeEditar && <EditFab onContentChanged={() => setRefreshKey((k) => k + 1)} />}

      <GalleryModal
        item={galleryState.item}
        items={galleryState.items}
        index={galleryState.index}
        onNavigate={navigateGallery}
        onClose={closeGallery}
      />
      <PostModal post={postItem} onClose={() => setPostItem(null)} />
    </div>
  );
}
