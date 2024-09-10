import {
  CustomerCategory,
  CustomerData,
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

export async function insertNewCustomerD1() {}
export async function updateCustomerDataD1() {}

export async function isRegisteredUserGSD1() {}
export async function getCurrentUserName() {}

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
