import { CustomerCategory, CustomerData } from "../types";

export function formatCustomerDataHTML(customerData: CustomerData): string {
  let formatText;
  formatText = "------\n";
  formatText += `"Kategori: <strong>${customerData.customer_category}</strong>\n`;
  formatText += `"Nama GC: <strong>${customerData.customer_name}</strong> + \n`;
  formatText += `"Submit Proposal (sudah/belum): <strong>${customerData.submit_proposal}</strong>\n`;
  formatText += `"Connectivity: <strong>${customerData.connectivity}</strong> \n`;
  formatText += `"Antares Eazy: <strong>${customerData.eazy}</strong>\n`;
  formatText += `"OCA: <strong>${customerData.oca}</strong>\n`;
  formatText += `"Digiclinic: <strong>${customerData.digiclinic}</strong>\n`;
  formatText += `"Pijar: <strong>${customerData.pijar}</strong>\n`;
  formatText += `"Sprinthink: <strong>${customerData.sprinthink}</strong>\n`;
  formatText += `"Nilai Project (Rp): <strong>${customerData.nilai_project}</strong>\n`;
  formatText += "------\n";

  return formatText;
}

export function formatPropertySelectionMenuHTML(customerCategory: CustomerCategory): string {
  let formatText;
  formatText = "<strong>Silahkan pilih informasi GC yang ingin di diubah</strong>\n";
  formatText += "Langsung klik saja pada tombol yang muncul di bawah!\n\n";
  formatText += "<strong>submit_proposal</strong>, apakah proposal masif telah dikirimkan.\n\n";
  formatText += "<strong>connectivity</strong>, status funneling layanan Datin/WMS/Indibiz/etc.\n\n";
  formatText += "<strong>eazy</strong>, status funneling Antares Eazy.\n\n";
  formatText += "<strong>oca</strong>, status funneling OCA.\n\n";
  formatText += "<strong>digiclinic</strong>, status funenling Digiclinic.\n\n";
  formatText += "<strong>pijar</strong>, status funneling ekosistem Pijar.\n\n";
  formatText += "<strong>sprinthink</strong>, status funneling Sprinthink.\n\n";
  formatText += "<strong>nilai_project</strong>, estimasi nilai project.\n\n";
  formatText += `<strong>CANCEL</strong>, kembali ke daftar pelanggan untuk kategori ${customerCategory}.`;

  return formatText;
}
