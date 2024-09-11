import {
  CustomerCategory,
  CustomerData,
  CustomerProperty,
  Funnel,
  PROPERTIES,
  UserCache,
} from "../types";

export async function getCustomerListD1(
	env: Env,
	chatId: number,
	customerCategory: CustomerCategory
): Promise<string[]> {
	try {
		const stmt = env.DATABASE.prepare(
			"SELECT nama_pelanggan FROM project_data WHERE telegram_id = ?1 AND kategori_pelanggan = ?2"
		);

		// Execute the query
		const customerList = (
			await stmt.bind(chatId, customerCategory).all<string>()
		).results;

		if (!customerList) {
			console.warn(
				`No customer name found for chatId: ${chatId}, category: ${customerCategory}`
			);
		}
		return customerList; // Return null if no cache found
	} catch (error: unknown) {
		console.error(
			`Error fetching customer list for chatID: ${chatId}, category: ${customerCategory}`,
			error
		);
		throw new Error("Failed to fetch customer list.");
	}
}

export async function getCustomerDataD1(
	env: Env,
	chatId: number,
	customerCategory: CustomerCategory,
	customerName: string
): Promise<CustomerData | null> {
	try {
		const stmt = env.DATABASE.prepare(
			`SELECT nama_pelanggan, ${PROPERTIES.join(
				", "
			)} FROM project_data WHERE telegram_id = ?1 AND kategori_pelanggan = ?2 AND nama_pelanggan = ?3`
		);

		const customerData = await stmt
			.bind(chatId, customerCategory, customerName)
			.first<CustomerData>();

		if (customerData) {
			return customerData;
		} else {
			console.warn(
				`No data found for chatId: ${chatId}, category: ${customerCategory}, customerName: ${customerName}`
			);
			return null; // Return null if no cache found
		}
	} catch (error) {
		console.error(
			`Error fetching customer data for chatID: ${chatId}, category: ${customerCategory}, customerName: ${customerName}`,
			error
		);
		throw new Error("Failed to fetch customer data.");
	}
}

export async function insertNewCustomerD1(
	env: Env,
	chatId: number,
	customerCategory: CustomerCategory,
	customerName: string
): Promise<boolean> {
	try {
		const stmt = env.DATABASE.prepare(
			"INSERT INTO project_data (telegram_id, nama_am, kategori_pelanggan, nama_pelanggan) VALUES (?1, ?2, ?3, ?4)"
		);

		const userName = await getCurrentUserNameD1(env, chatId);
		const { success } = await stmt
			.bind(chatId, userName, customerCategory, customerName)
			.all();

		return success;
	} catch (error) {
		console.error(
			`Error inserting new customer data for chatID: ${chatId}, category: ${customerCategory}, customerName: ${customerName}`,
			error
		);
		throw new Error("Failed to insert new customer data.");
	}
}

export async function updateCustomerDataD1(
	env: Env,
	chatId: number,
	customerCategory: CustomerCategory,
	customerName: string,
	customerProperty: CustomerProperty,
	updateValue: "SUDAH" | "BELUM" | Funnel | number
): Promise<boolean> {
	try {
		// Final SQL query
		const sql = `UPDATE project_data SET ${customerProperty} = ?4 WHERE telegram_id = ?1 AND kategori_pelanggan = ?2 AND nama_pelanggan = ?3`;
		const stmt = env.DATABASE.prepare(sql);
		const { success } = await stmt
			.bind(chatId, customerCategory, customerName)
			.all();

		return success;
	} catch (error) {
		// Log the error
		console.error(`Error updating user cache for chatId: ${chatId}`, error);
		// Optionally rethrow the error or handle it as needed
		throw new Error("Failed to update user cache.");
	}
}

export async function isRegisteredUserD1(
	env: Env,
	chatId: number
): Promise<boolean> {
	try {
		const stmt = env.DATABASE.prepare(
			"SELECT name FROM users WHERE telegram_id = ?1"
		);

		const userName = await stmt.bind(chatId).first<string>();

		if (userName) {
			return true;
		} else {
			console.warn(`No user data found for chatId: ${chatId}`);
			return false;
		}
	} catch (error) {
		console.error(
			`Error fetching current user data for chatID: ${chatId}`,
			error
		);
		throw new Error("Failed to insert new customer data.");
	}
}

export async function getCurrentUserNameD1(
	env: Env,
	chatId: number
): Promise<string | null> {
	try {
		const stmt = env.DATABASE.prepare(
			"SELECT name FROM users WHERE telegram_id = ?1"
		);

		const userName = await stmt.bind(chatId).first<string>();

		if (userName) {
			return userName;
		} else {
			console.warn(`No user data found for chatId: ${chatId}`);
			return null;
		}
	} catch (error) {
		console.error(
			`Error fetching current user name for chatID: ${chatId}`,
			error
		);
		throw new Error("Failed to insert new customer data.");
	}
}

export async function getUserCache(
	env: Env,
	chatId: number
): Promise<UserCache | null> {
	try {
		const stmt = env.DATABASE.prepare(
			"SELECT user_state, customer_category, customer_name, customer_property FROM user_cache WHERE telegram_id = ?1"
		);

		// Execute the query
		const cache = await stmt.bind(chatId).first<UserCache>();

		if (cache) {
			return cache;
		} else {
			console.warn(`No cache found for chatId: ${chatId}`);
			return null; // Return null if no cache found
		}
	} catch (error: unknown) {
		console.error(`Error fetching user cahce for chatID: ${chatId}`, error);
		throw new Error("Failed to fetch user cache.");
	}
}

export async function updateUserCache(
	env: Env,
	chatId: number,
	updateCache: Partial<UserCache>
): Promise<boolean> {
	try {
		// Create an array to hold the dynamic SQL parts
		const updates = []; // for constructing query
		const values = []; // for bindings

		// Build dynamic SQL and parameter array based on available fields
		if (updateCache.user_state !== undefined) {
			updates.push("user_state = ?");
			values.push(updateCache.user_state);
		}
		if (updateCache.customer_category !== undefined) {
			updates.push("customer_category = ?");
			values.push(updateCache.customer_category);
		}
		if (updateCache.customer_name !== undefined) {
			updates.push("customer_name = ?");
			values.push(updateCache.customer_name);
		}
		if (updateCache.customer_property !== undefined) {
			updates.push("customer_property = ?");
			values.push(updateCache.customer_property);
		}

		if (updates.length === 0) {
			console.warn(`No updates provided for chatId: ${chatId}`);
			return false; // Nothing to update
		}

		// Add chatId for the WHERE clause
		values.push(chatId);

		// Final SQL query
		const sql = `UPDATE user_cache SET ${updates.join(
			", "
		)} WHERE telegram_id = ?`;

		const stmt = env.DATABASE.prepare(sql);

		// Execute the update statement
		const { success } = await stmt.bind(...values).all();

		return success;
	} catch (error) {
		// Log the error
		console.error(`Error updating user cache for chatId: ${chatId}`, error);
		// Optionally rethrow the error or handle it as needed
		throw new Error("Failed to update user cache.");
	}
}
