import { TAdminRole } from '../types/adminRole.type';

export const seedRoleAdminData: TAdminRole = {
  name: 'Super Admin',
  roleFeature: [
    { name: 'Auth', path: 'auth', index: 1 },
    { name: 'Roles & Permissions', path: 'roles_permissions', index: 2 },
    { name: 'Blogs', path: 'blogs', index: 3 },
    { name: 'Five Pillar', path: 'fivePillarsOfIslam', index: 4 },
    { name: 'Contacts', path: 'contacts', index: 5 },
    { name: 'Services', path: 'services', index: 6 },
    { name: 'Update Profile', path: 'update-profile', index: 7 },
    { name: 'Page Settings', path: 'page-setting', index: 8 },
    // Page Settings sub-routes
    { name: 'Hero Area', path: 'page-setting/hero-area', index: 8.1 },
    { name: 'About Us', path: 'page-setting/about-us', index: 8.2 },
    { name: 'Contact Us', path: 'page-setting/contact-us', index: 8.3 },
    { name: 'Packages', path: 'packages', index: 9 },
    { name: 'Gallery', path: 'gallery', index: 10 },
    { name: 'Reviews', path: 'reviews', index: 11 },
    { name: 'Video Gallery', path: 'video-gallery', index: 12 },
  ],
};

export const featureNames = {
  auth: 'auth',
  rolesAndPermissions: 'roles_permissions',
  blogs: 'blogs',
  fivePillarsOfIslam: 'fivePillarsOfIslam',
  contacts: 'contacts',
  services: 'services',
  profile: 'update-profile',
  settings: 'page-setting',
  settingsHeroArea: 'page-setting/hero-area',
  settingsAboutUs: 'page-setting/about-us',
  settingsContactUs: 'page-setting/contact-us',
  packages: 'packages',
  gallery: 'gallery',
  reviews: 'reviews',
  videoGallery: 'video-gallery',
};