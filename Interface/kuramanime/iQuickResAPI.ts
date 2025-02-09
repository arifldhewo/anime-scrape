export interface iQuickResAPI {
	current_page: number;
	animes: Animes;
	last_page: number;
}

interface Animes {
	current_page: number;
	data: AnimesData[];
	first_page_url: string;
	from: number;
	last_page: number;
	next_page_url: string | null;
	path: string;
	per_page: number;
	prev_page_url: string | null;
	to: number;
	total: number;
}

interface AnimesData {
	id: number;
	title: string;
	slug: string;
	synopsis: string;
	synopsis_short: string;
	total_episodes: number | null;
	aired_from: string | null;
	aired_to: string | null;
	schedule_day: string;
	schedule_time: string;
	score: number | null;
	votes: number;
	country_code: string;
	latest_episode: number;
	latest_post_at: string | null;
	posts: PostsData[];
}

interface PostsData {
	id: number;
	admin_id: number;
	anime_id: number;
	title: string;
	episode: number;
}
