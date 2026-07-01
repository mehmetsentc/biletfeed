import {
  organizerHelpArticles,
  organizerHelpCategories
} from '@/lib/data/organizer-help-center';
import { OrganizerHelpHome } from '@/components/organizator-panel/organizer-help-center';

export default function OrganizatorHelpPage() {
  return (
    <OrganizerHelpHome
      categories={organizerHelpCategories}
      articles={organizerHelpArticles}
    />
  );
}
