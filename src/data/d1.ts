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
): Promise<CustomerData[]> {
	try {
		const stmt = env.DATABASE.prepare(
			`SELECT customer_name, ${PROPERTIES.join(", ")} FROM project_data WHERE telegram_id = ?1 AND customer_category = ?2`
		);

		// Execute the query
		const customerList = (
			await stmt.bind(chatId, customerCategory).all<CustomerData>()
		).results;

		if (!customerList) {
			console.warn(
				`No customer name found for chatId: ${chatId}, category: ${customerCategory}`
			);
		}
		return customerList; // Return empty array if no customer found
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
			`SELECT customer_name, ${PROPERTIES.join(
				", "
			)} FROM project_data WHERE telegram_id = ?1 AND customer_category = ?2 AND customer_name = ?3`
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
			"INSERT INTO project_data (telegram_id, account_manager, customer_category, customer_name) VALUES (?1, ?2, ?3, ?4)"
		);

		console.log(`Getting user name for chatId: ${chatId}...`)
		const userName = await getCurrentUserNameD1(env, chatId);
		console.log(`Inserting new customer ${JSON.stringify({chatId, userName, customerCategory, customerName})}`)
		const { success } = await stmt
			.bind(chatId, userName, customerCategory, customerName)
			.all();
		console.log(`Insert success = ${success}`)

		return success;
	} catch (error) {
		console.error(
			`Error inserting new customer data for ${JSON.stringify({chatId, customerCategory, customerName})}`,
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
		const sql = `UPDATE project_data SET ${customerProperty} = ?4 WHERE telegram_id = ?1 AND customer_category = ?2 AND customer_name = ?3`;
		const stmt = env.DATABASE.prepare(sql);
		const { success } = await stmt
			.bind(chatId, customerCategory, customerName, updateValue)
			.all();

		return success;
	} catch (error) {
		// Log the error
		console.error(`Error updating user cache for chatId: ${chatId}`, error);
		// Optionally rethrow the error or handle it as needed
		throw new Error("Failed to update customer data.");
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
		throw new Error("Failed to get current user data.");
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

		const user = await stmt.bind(chatId).first<{"name": string}>()
		const userName = user?.name;

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
		throw new Error("Failed to get current user data.");
	}
}

export async function getUserCacheD1(
	env: Env,
	chatId: number
): Promise<UserCache | null> {
	console.log("Reading user cache...")
	try {
		const stmt = env.DATABASE.prepare(
			"SELECT user_state, customer_category, customer_name, customer_property FROM user_cache WHERE telegram_id = ?1"
		);

		// Execute the query
		const cache = await stmt.bind(chatId).first<UserCache>();

		if (cache) {
			console.log("Cache retreived successfully.", JSON.stringify(cache))
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

export async function updateUserCacheD1(
	env: Env,
	chatId: number,
	updateCache: Partial<UserCache>
): Promise<boolean> {
	console.log("Updating user cache...");
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
		if (updateCache.customer_name !== undefined && updateCache.customer_name !== null) {
			updates.push("customer_name = ?");
			values.push(updateCache.customer_name);
		}
		if (updateCache.customer_property !== undefined && updateCache.customer_property !== null) {
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
		console.log(`The query '${sql}' | with values: ${values} | has ${success ? 'completed' : 'failed'}.`)

		return success;
	} catch (error) {
		// Log the error
		console.error(`Error updating user cache for chatId: ${chatId}`, error);
		// Optionally rethrow the error or handle it as needed
		throw new Error("Failed to update user cache.");
	}
}
