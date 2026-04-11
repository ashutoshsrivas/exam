-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Apr 11, 2026 at 12:00 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `exam`
--

-- --------------------------------------------------------

--
-- Table structure for table `duties`
--

CREATE TABLE `duties` (
  `id` int(11) NOT NULL,
  `title` text DEFAULT NULL,
  `academicsession` text DEFAULT NULL,
  `type` text DEFAULT NULL,
  `createdat` text DEFAULT NULL,
  `professor` int(11) DEFAULT 4,
  `assistantprofessor` int(11) DEFAULT 8,
  `associateprofessor` int(11) DEFAULT 6,
  `researchscholar` int(11) DEFAULT 10
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `duties`
--

INSERT INTO `duties` (`id`, `title`, `academicsession`, `type`, `createdat`, `professor`, `assistantprofessor`, `associateprofessor`, `researchscholar`) VALUES
(1, 'test', '2025-26', 'Mid Term', '2026-01-02 18:26:09', 2, 8, 6, 10);

-- --------------------------------------------------------

--
-- Table structure for table `limits`
--

CREATE TABLE `limits` (
  `id` int(11) NOT NULL,
  `role` text DEFAULT NULL,
  `duties` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `limits`
--

INSERT INTO `limits` (`id`, `role`, `duties`) VALUES
(1, 'Admin', 0),
(2, 'Assistant Professor', 8),
(3, 'Associate Professor', 6),
(4, 'Professor', 4),
(5, 'Research Scholar', 10);

-- --------------------------------------------------------

--
-- Table structure for table `preferences`
--

CREATE TABLE `preferences` (
  `id` int(11) NOT NULL,
  `slotid` int(11) DEFAULT NULL,
  `userid` int(11) DEFAULT NULL,
  `times` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `preferences`
--

INSERT INTO `preferences` (`id`, `slotid`, `userid`, `times`) VALUES
(1, 1, 2, '2026-01-10 09:28:47'),
(2, 2, 2, '2026-01-10 09:28:47');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `name` text DEFAULT NULL,
  `need` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `name`, `need`) VALUES
(1, 'LT 01', 2),
(2, 'LT 02', 3);

-- --------------------------------------------------------

--
-- Table structure for table `slot`
--

CREATE TABLE `slot` (
  `id` int(11) NOT NULL,
  `duty` int(11) DEFAULT NULL,
  `slottext` text DEFAULT NULL,
  `slottime` text DEFAULT NULL,
  `slotdate` text DEFAULT NULL,
  `requirement` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `slot`
--

INSERT INTO `slot` (`id`, `duty`, `slottext`, `slottime`, `slotdate`, `requirement`) VALUES
(1, 1, 'M1', '12:30', '2026-01-14', 1),
(2, 1, 'demo slot', '12:30', '2026-01-22', 20),
(3, 1, 'Small', '16:30', '2026-01-29', 2);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `employeeid` text DEFAULT NULL,
  `name` text DEFAULT NULL,
  `email` text DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `pass` text DEFAULT NULL,
  `role` text DEFAULT NULL,
  `department` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `employeeid`, `name`, `email`, `phone`, `pass`, `role`, `department`) VALUES
(1, 'IT101645', 'Ashutosh Srivastava', 'ashutoshsrivastava.mgt@geu.ac.in', '8126134565', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Admin', 'Managemt'),
(2, '123456', 'Ashutosh Test', 'ashu@g.com', '1234567890', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Managemt'),
(3, '101', '1', '', NULL, 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Professor', 'Computer Application'),
(5, '3114584', 'Dr. Vijay Kumar Patidar', '', '9997997127', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'Aerospace Engineering'),
(6, '1624112240', 'Dr. Pushpendra Kumar', '', '7505620739', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'Aerospace Engineering'),
(7, '93115023', 'Dr. Kumar Gaurav', '', '9880099049', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'Aerospace Engineering'),
(8, '93113708', 'Mr. Alok Kumar', '', '8340509010', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Aerospace Engineering'),
(9, '7924211585', 'Prof. Kumud Pant', '', '9897529207', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'Bioscience'),
(10, 'LS02211470', 'Dr. Shivangi Chamoli', '', '8958434454', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'Bioscience'),
(11, 'LSGF212935', 'Dr. Neha Pandey', '', '9410729032', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Bioscience'),
(12, 'LS02112911', 'Dr. Deependra Pratap Singh', '', '9457479939', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Bioscience'),
(13, '7902113898', 'Dr. Sachin Sharma', '', '6367417542', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Bioscience'),
(14, '2115260', 'Dr. Arkadeep Mukherjee', '', '8427863414', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Bioscience'),
(15, '2114846', 'Dr. Nitin Pandey', '', '9910189203', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Bioscience'),
(16, '2212382', 'Ms. Kiran Bisht', '', '9818844712', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Bioscience'),
(17, '2115646', 'Dr. Srichandan Padhi', '', '7008689403', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Bioscience'),
(18, '221233', 'Dr. Pooja Bhatnagar', '', '7456089296', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Bioscience'),
(19, '7902112244', 'Mr. Nilay Singh', '', '8218524481', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Bioscience'),
(20, '7902112503', 'Dr. Durgesh Jaiswal', '', '8960899162', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Bioscience'),
(21, '7902112372', 'Dr. Ashish Gaur', '', '9716386704', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Bioscience'),
(22, '79213997', 'Dr. Tanvir Kaur', '', '9877068575', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Bioscience'),
(23, '215908', 'Dr. Rajeshwari Negi', '', '6230080654', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Bioscience'),
(24, '215910', 'Dr. Simranjeet Kaur', '', '9459694373', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Bioscience'),
(25, '7993210859', 'Dr. Pallavi Singh', '', '8750406460', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'BT'),
(26, 'LS221819071', 'Dr. Janhvi Mishra Rawat', '', '9411525499', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'BT'),
(27, '79RS112663', 'Dr. Jigisha Anand', '', '9837807052', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'BT'),
(28, '7902211301', 'Dr. Payal Gupta', '', '9760882930', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'BT'),
(29, '7928101030', 'Dr Pramod Rawat', '', '9557017295', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'BT'),
(30, '7902110688', 'Dr Yashaswi Singh', '', '7830693991', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'BT'),
(31, '7902113957', 'Dr. Avinash', '', '9816867384', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'BT'),
(32, '7902213908', 'Dr. Jyotsna Misra', '', '93541 86012', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'BT'),
(33, '7902215336', 'Dr. Megha', '', '7838132723', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'BT'),
(34, '7902110689', 'Er. Prateek Gururani', '', '9456769488', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'BT'),
(35, '7902212946', 'Er. Somya Sinha', '', '6398452370', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'BT'),
(36, '7993113942', 'Dr. Divakar Sharma', '', '7906026680', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'BT'),
(37, '79113979', 'Dr. Mayank Bhushan', '', '6200108855', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'BT'),
(38, '7902113952', 'Dr. Abhishek Kumar', '', '9650201490', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'BT'),
(39, '79114084', 'Dr. Yograj Bisht', '', '9816837772', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'BT'),
(40, '7902215595', 'Dr. Tanuja Joshi', '', '8273910970', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'BT'),
(41, '7902212231', 'Madhulika Jha', '', '8004914021', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'BT'),
(42, '7902212232', 'Ragini Kahera', '', '9675727721', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'BT'),
(43, '7902212259', 'Sonam Khan', '', '7055839434', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'BT'),
(44, '7902212230', 'Pooja Singh', '', '6398426587', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'BT'),
(45, '3203210953', 'Dr. Ashulekha Gupta', '', '9410189638', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'DOMS'),
(46, '3202210871', 'Dr. Gunjan Moudgil', '', '8077337896', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(47, 'F393210575', 'Dr. Khyati Kapil', '', '9759254380', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'DOMS'),
(48, '3293214888', 'Dr. Kirti Udayai', '', '9971389941', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'DOMS'),
(49, '3224210936', 'Dr. Manu Sharma', '', '9557274967', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'DOMS'),
(50, '3202112479', 'Dr. Mohammad Kashif', '', '9837255985', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(51, '3202103151', 'Dr. Nagendra Sharma', '', '9839097291', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'DOMS'),
(52, '3293113150', 'Dr. Neeraj Sharma', '', '9557185349', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'DOMS'),
(53, '3203113946', 'Dr. Pawan Kumar', '', '9466322425', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'DOMS'),
(54, '3224110208', 'Dr. Praveen Singh', '', '9358112799', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'DOMS'),
(55, '3203110975', 'Dr. Rajesh Tiwari', '', '9996016775', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'DOMS'),
(56, '3202115202', 'Dr. Raman Kumar Singh', '', '9891252352', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(57, '3203113904', 'Dr. Ratnakar Mishra', '', '9437199973', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'DOMS'),
(58, '3203115290', 'Dr. Sanjay Kumar', '', '9811311382', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'DOMS'),
(59, '3203112803', 'Dr. Vinay Kandpal', '', '7417012388', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'DOMS'),
(60, '3202110886', 'Dr. Yogesh Bhatt', '', '7696060507', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'DOMS'),
(61, '3224110953', 'Mr Chirag Singhal', '', '9760730005', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(62, '3202115050', 'Mr. Abhijit Thapa', '', '9748470010', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(63, '6824110675', 'Mr. Abhishek Misra', '', '9410979230', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(64, '3202113808', 'Mr. Anshuman Singh', '', '6307340735', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(65, '3202114111', 'Mr. Anurag Nagar', '', '8279845548', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(66, '4102113255', 'Mr. Deepak Juyal', '', '9811619031', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(67, '3202111655', 'Mr. Janmejai Kumar Shah', '', '9675885689', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(68, '3202110920', 'Mr. Kapil Ahalawat ', '', '8800337593', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(69, '3202114901', 'Mr. Lalit Singh Dyarakoti', '', '6396714630', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(70, '32112157', 'Mr. Mohit Gundwal', '', '7310953857', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(71, '3293114879', 'Dr. Piyush ', '', '9971399941', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'DOMS'),
(72, '3202115337', 'Mr. Prabhu Saran Mathur', '', '9792222993', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(73, '3202114900', 'Mr. Saksham Agarwal', '', '7302196171', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(74, '3202113882', 'Mr. Shashank Semwal', '', '6361059552', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(75, '3202114286', 'Mr. Vikash Kumar', '', '7004602860', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(76, '32TA110677', 'Mr. Vivek Verma', '', '7600021298', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(77, '2202213804', 'Ms. Akshita Chaudhary ', '', '9627328605', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(78, '3202212218', 'Ms. Anshu Latiyan', '', '9568785803', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(79, '3202214961', 'Ms. Ashi Singhal', '', '9634577714', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(80, '3202215901', 'Ms. Diksha Batra', '', '70171 65041', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(81, '3202212891', 'Ms. Chahat Sahani ', '', '8630117073', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(82, '3202213236', 'Ms. Garima Jaitly', '', '9517394712', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(83, '3202214926', 'Ms. Isha Manwal', '', '9682196810', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(84, 'TCIT200959', 'Ms. Ishika Singhal ', '', '9997205150', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(85, '3202214936', 'Ms. Kanika Rawat', '', '8534028889', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(86, '3202214924', 'Ms. Khushi', '', '7017201760', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(87, '3202214923', 'Ms. Lavanya Arora', '', '9389683078', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(88, '3202214922', 'Ms. Mansi Nautiyal', '', '9167975268', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(89, '3202214927', 'Ms. Priya', '', '7409017674', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(90, '3202211037', 'Ms. Priyanka Gupta', '', '7017151203', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(91, '3202213814', 'Ms. Priyanka Waldia ', '', '7830059487', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(92, '3202211657', 'Ms. Roopika kahera ', '', '9760103584', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(93, '3202210951', 'Ms. Sanghmitra ', '', '8881760958', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(94, 'N5202107', 'Ms. Sanjana Bhardwaj', '', '8791190910', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(95, '2202213803', 'Ms. Shivani Nautiyal ', '', '8171051154', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(96, '3202214389', 'Ms. Sneha Singh ', '', '9627727080', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(97, '3202213695', 'Ms. Stuti Upadhayay                          ', '', '9634806028', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(98, '3202214925', 'Ms. Surbhi Joshi', '', '7310642710', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(99, '3202214943', 'Ms. VAISHALI ALCHONI', '', '8273632318', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(100, '3202213807', 'Ms. Vibhuti Jain', '', '9756539402', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(101, '3202214896', 'Ms. Yuganshi Gupta', '', '7983802228', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'DOMS'),
(102, '2024210440', 'Dr. Archana Bachheti', '', '7060943924', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'Environmental Science'),
(103, '1028200618', 'Dr. Suman Naithani', '', '9793050585', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Environmental Science'),
(104, '2002112508', 'Dr. Rachan Karmakar', '', '8437525941', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Environmental Science'),
(105, '2002212395', 'Dr. Swati Singh', '', '8630272752', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Environmental Science'),
(106, '2002212251', 'Dr. Deepti Singh Vashishth', '', '8899080250', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Environmental Science'),
(107, '2002112238', 'Mr. Ashish Kumar Arya', '', '8755322345', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Environmental Science'),
(108, '2002212223', 'Ms. Sweta Upadhyay', '', '8318185361', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Environmental Science'),
(109, '2002213060', 'Ms. Barkha Bisht', '', '8755787528', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Environmental Science'),
(110, '1824210566', 'Dr. Bhawna', '', '9412347408', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CHEMISTRY'),
(111, '1824211774', 'Dr. Arunima Nayak', '', '9557108497', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CHEMISTRY'),
(112, '1824210679', 'Dr. Neetu Sharma', '', '9410592176', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CHEMISTRY'),
(113, '1824111700', 'Dr. Brij Bhushan', '', '9837579633', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CHEMISTRY'),
(114, '1802113223', 'Dr. Harish Chandra Joshi', '', '9634759118', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CHEMISTRY'),
(115, '1803114209', 'Dr. Naveen Chandra Joshi', '', '9410585148', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CHEMISTRY'),
(116, '1893111745', 'Dr. Waseem Ahmad', '', '9956055656', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CHEMISTRY'),
(117, '1802215195', 'Dr. Shweta Bisht', '', '8267851995', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CHEMISTRY'),
(118, '1802212241', 'Ms Priya Chaudhary', '', '8448171610', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CHEMISTRY'),
(119, '1802212240', 'Ms Priyanka Negi', '', '8126194440', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CHEMISTRY'),
(120, '18215670', 'Dr. Vibha Joshi', '', '7455966024', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CHEMISTRY'),
(121, '1893115720', 'Dr. Man Vir', '', '8302389668', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CHEMISTRY'),
(122, '2193113098', '(Prof.)Dr.Mohammad Wazid', '', '8886789560', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(123, '2124110503', '(Prof.)Dr.Santosh Kumar', '', '8126215153', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(124, '2103111214', '(Prof.)Dr.Sarvesh Vishwakarma', '', '8762124176', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(125, '2124110505', '(Prof.)Dr.Vijay Singh', '', '9760322316', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(126, '2193113092', '(Pro.f)Dr.Manoj Diwakar ', '', '9648676112', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(127, '2193111021', '(Prof.)Dr.Prakash Srivastava', '', '8433169233', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(128, '2324110257', '(Prof.)Dr.Manish Sharma', '', '9634432297', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(129, '2124111570', '(Prof.)Dr.Vikas Tripathi ', '', '9634596042', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(130, '2124110508', '(Prof.)Dr.Sumit Pundir', '', '9997219039', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(131, '1224210254', '(Prof.)Dr.Akansha Gupta', '', '7017536952', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(132, '2324110282', '(Prof.)Dr.Noor Mohd', '', '9897404423', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(133, '1424111424', '(Prof.)Dr.Ashwini Kumar Singh ', '', '8006936640', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(134, '2103115297', '(Prof.)Dr.SHAILENDRA NARAYAN  SINGH', '', '9871910087', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(135, '2103115299', '(Prof.)Dr.Deepak Asrani', '', '9415518690', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(136, '2102210868', '(Prof.)Dr.Jyoti Agarwal', '', '8130124121', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(137, '2193112153', '(Prof.)Dr.Amit Kumar', '', '9997071364', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(138, '2124210884', '(Prof.)Dr.Parul Madan', '', '9557840852', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(139, '2124210925', '(Prof.)Dr.Shuchi Bhadula', '', '7830036274', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(140, '2103115860', '(Prof.)Dr.Ravi Praksh ', '', '8979048096', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CSE'),
(141, '2124110426', 'Dr.Ankur Choudhary', '', '9760316521', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(142, '2193113875', 'Dr.Hriday Kumar Gupta', '', '9758514515', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(143, '2324110089', 'Mr.Navin Garg', '', '9837193095', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(144, '2193113415', 'Dr.Ankit Vishnoi', '', '9971999472', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(145, '2102113061', 'Dr.ASHWINI KUMAR', '', '9999248007', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(146, '2102112982', 'Dr.Ankit Tomar', '', '9458608938', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(147, '1124110904', 'Dr.Hemant Singh Pokhariya', '', '9634749537', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(148, '2102110842', 'Dr. Prabh deep Singh', '', '9041726540', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(149, '2193112337', 'Dr.Neeraj Kumar Pandey', '', '9411511171', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(150, '2193112342', 'Dr.Pawan Kumar Mishra', '', '9411413630', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(151, '2193113900', 'Dr.Deepak Gaur', '', '9873905675', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(152, '2102111521', 'Dr.Abhishek Sharma', '', '9719470443', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(153, '2124110636', 'Mr.Dibyahash Bordoloi', '', '9719420263', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(154, '2102112684', 'Mr.Shiv Ashish Dhaudiyal', '', '9568259203', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(155, '2102111497', 'Dr.Vivek Tomar', '', '9999895917', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(156, '2102113985', 'Dr.Pradeep Bedi', '', '9267939486', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'CSE'),
(157, '2129111287', 'Mr.Kireet Joshi', '', '7500275404', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(158, '10TA111523', 'Mr.Pareshwar Prasad Barmola', '', '7983432735', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(159, '21PT212734', 'Ms.Garima Sharma ', '', '9958177157', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(160, '2102112694', 'Mr.Priyank Pandey', '', '9560950771', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(161, 'N5H4102843', 'Mr.Yuvraj Joshi', '', '9639878487', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(162, '1429211657', 'Ms.Akanksha kapruwan', '', '9045896584', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(163, '2224110477', 'Mr.Ramesh Singh Rawat', '', '9412379001', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(164, '2329210916', 'Ms.Swati ', '', '8755669356', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(165, '2124112276', 'Dr.Ashish Garg', '', '9045942411', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(166, '2102213134', 'Ms.Vishu Tyagi', '', '9990456207', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(167, '2102213253', 'Ms.Meenakshi Maindola', '', '9675391680', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(168, '2336110544', 'Mr.Sanjeev Kukreti', '', '9997226690', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(169, '2102210681', 'Ms.Ankita Nainwal', '', '8218381577', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(170, '2102112727', 'Mr.Piyush Agarwal', '', '7829983490', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(171, '2102210838', 'Ms.Vipashi kansal', '', '7417520889', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(172, '2510221081', 'Dr.Upma jain', '', '8305517539', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(173, '2102111018', 'Mr.Gulshan Dhasmana', '', '8077324858', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(174, '2102111026', 'Mr.Arnav Kotiyal', '', '8535074440', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(175, '2102111019', 'Dr.Vidit Kumar', '', '9760997539', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(176, '2102111443', 'Mr.Mukesh Singh', '', '7990339287', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(177, '14PT212534', 'Mrs.Devyani Rawat', '', '9897999151', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(178, '2129111933', 'Mr.Yogesh Lohumi', '', '8171375006', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(179, '2102112243', 'Mr.Mudit Mittal', '', '9719453922', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(180, '2102112242', 'Mr.Rohan Verma', '', '7895841773', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(181, '2102112323', 'Dr.Rehan', '', '9548283808', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(182, '2102212336', 'Dr.Anita Saroj', '', '8090451314', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(183, '2102112487', 'Dr.Pramod Mehra', '', '7983988579', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(184, '21TN113022', 'Mr.Ankit Tripathi', '', '8090918721', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(185, '2102112501', 'Mr.Jyotir Moy Chatterjee', '', '7050017547', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(186, '2102112424', 'Dr.Hradesh Kumar', '', '7018442494', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(187, '2102112475', 'Dr.Sanjay Roka', '', '6396999743', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(188, '21TA111471', 'Mr.Darshan Singh', '', '8077824260', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(189, '2102113291', 'Mr.Navneet Rajpoot ', '', '7906921390', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(190, '2102114056', 'Mr.Chitransh Bose', '', '7302608468', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(191, '2102114070', 'Mr.Kuldeep Nautiyal', '', '9105393944', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(192, '2102114141', 'Mr.OM Prakash Pal', '', '9760388389', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(193, '2102114156', 'Mr.Sharath K R ', '', '8722459785', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(194, '2102114205', 'Ms.Anamika Sharma', '', '9810527360', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(195, '2102114218', 'Mr.Vishal Trivedi', '', '9827869776', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(196, '2102114435', 'Mr.Kartikey Arora ', '', '8077942208', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(197, '21TA211383', 'Ms. Akshita Patwal', '', '7060637572', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(198, '2102213968', 'Ms.Ashwini Yeole', '', '9760020928', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(199, '2102213967', 'Ms.Isha Deshmukh', '', '8191057596', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(200, '2102112256', 'Mr.Jagdish Chandola ', '', '8630627831', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(201, '21TA111382', 'Dr.Siddhant Thapliyal', '', '9759073507', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(202, '23105485', 'Mr.Vishnu Singh Shekhawat ', '', '8233997949', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(203, '21115483', 'Mr.Kamal Kumar Gola', '', '9456893676', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(204, '2102115572', 'Mr.Kanishka Bhatt', '', '8057022050', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(205, '21TA113772', 'Mr.Siddharth Dangwal', '', '7579409705', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(206, '21TA114889', 'Mr.Utkarsh Pant', '', '9119029149', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(207, '21TA214892', 'Ms.Nishtha Bhatt', '', '9634777941', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(208, '21TA114893', 'Mr.Abhinav Kotnala ', '', '9084402971', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(209, '21TA114897', 'Mr.Sachin Bhatt', '', '9389696471', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(210, '21TA114895', 'Mr.Sujal Bindra', '', '9286064945', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(211, '21TA214912', 'Ms.Shrishti Chamoli', '', '8273002940', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(212, '21TA214898', 'Ms.KumKum', '', '7076095856', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(213, '21TA114918', 'Ms.Manish Mehta', '', '8755647578', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(214, '21TA114920', 'Mr.Chirag Tyagi', '', '6396674120', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(215, '21TA114915', 'Mr.Vimal Singh', '', '8922829000', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(216, '21TA214916', 'Ms.Priyanka Rastogi', '', '7248365450', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(217, '21TA114919', 'Mr.Ram Ji Chauhan', '', '8869932039', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(218, '21TA214949', 'Ms.Megha Garg', '', '7088740130', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(219, '21TA114914', 'Mr.Priyanshu Rawat', '', '6395683010', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(220, '21TA114913', 'Mr.Himanshu Mainwal', '', '9368683443', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(221, '0728203901', 'Ms.Ayushi Saini', '', '7668770649', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(222, '21TA115150', 'Ms.Anushka Sikarwar', '', '8817771086', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CSE'),
(223, '2224210472', '(Prof.)Dr.Varsha Mittal', '', '9634435387', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'CA'),
(224, '2202213984', 'Dr.Vartika Agarwal', '', '7701994248', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(225, '2202111046', 'Mr.Gagan deep singh', '', '9927035279', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(226, '2202112653', 'Dr.Vandana rawat', '', '7055001712', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(227, '2224211268', 'Mrs.Geetika Sharma', '', '8171768899', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(228, 'VSSD101809', 'Mr.Harendra Singh Negi', '', '8126475013', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(229, '2202211420', 'Ms.Afsar Jahan', '', '9027576208', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(230, '2202113795', 'Mr.Abhishek Thapa', '', '6397284841', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(231, '2202113796', 'Mr.Mohit Amoli', '', '7451958189', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(232, '2202113797', 'Mr.Nikhil Bisht', '', '7060433155', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(233, '2202213806', 'Ms.Ayushi Diwedi', '', '6265771691', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(234, '2202113794', 'Mr.Priyansh Kumar', '', '7500068057', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(235, '2202213792', 'Ms.Gunjan Mehra', '', '7088316631', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(236, '2202113799', 'Mr.Pratik Kumar', '', '8404941098', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(237, '2202213802', 'Ms.Swati Pant', '', '7500057411', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(238, '2202113812', 'Mr.Utsav Kumar', '', '9576685689', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(239, '2202213800', 'Ms.Shikha Thakur', '', '7895932396', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(240, '2202213813', 'Ms.Aakriti Singh', '', '7500220070', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(241, '2202213801', 'Ms.Rashmi Kanyal', '', '6397154208', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(242, '2202113798', 'Mr.Vikash Kumar', '', '8678813350', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(243, '2202214921', 'Ms.Divya ', '', '7668208965', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(244, '2202214903', 'Ms.Shruti Bahuguna ', '', '8191900644', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(245, '2202114910', 'Mr.Shubham Kumar', '', '7260882890', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(246, '2202114908', 'Mr.Gautam Badoni', '', '8218100582', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(247, '2202214907', 'Ms.Shruti Saini', '', '9897625839', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(248, '2202214945', 'Ms.Payal karki', '', '9193114289', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(249, '2202214944', 'Ms.Shiwani Bhaskar ', '', '8445159744', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(250, '2202114909', 'Mr.Prajjwal Kumar', '', '8538917091', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(251, '2202214911', 'Ms.Shivani Sharma', '', '8433144613', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(252, '2202114904', 'Mr.Ravi Raushan', '', '7256049232', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(253, '2202114905', 'Mr.Raunak kumar', '', '9905552766', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(254, '2202114906', 'Mr.Krishna Kumar ', '', '6201645675', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(255, '2202114902', 'Mr.Viplaw Kumar Sinha', '', '9548962381', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(256, '22TA111976', 'Mr. Mohd. Shauib', '', '9557706428', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(257, '22TA211974', 'Ms.Aayushi Rana', '', '7409561192', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(258, '0728103047', 'Mr.Saurav Dev', '', '7409071343', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(259, '2202115630', 'Mr. Pratham Setia', '', '6398422621', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'CA'),
(260, '1603113153', 'Dr. Desh Bandhu Singh (RF)', '', '8700069362', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'ME'),
(261, ' 1603111223', 'Dr. Rakesh Chandmal Sharma', '', '8059930977', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'ME'),
(262, '1618110962', 'Mr. Amir Shaikh', '', '9639977072', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'ME'),
(263, ' 1602110972', 'Dr. Ashwani Kharola', '', '7248341821', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'ME'),
(264, ' 11JR103031', 'Dr. Brijesh Prasad', '', '8476025243', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'ME'),
(265, ' 1629111670', 'Dr. Gagan Bansal', '', '9897055488', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'ME'),
(266, ' 1602110911', 'Dr. Lalit Ranakoti', '', '9599541923', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ME'),
(267, '1624111898', 'Mr. Paritosh Mishra', '', '7895128366', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ME'),
(268, '1628101402', 'Mr. Durgeshwar Pratap Singh', '', '9759904189', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ME'),
(269, '1602112477', 'Dr. Narendra Gariya', '', '8077704272', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ME'),
(270, '1602112263', 'Dr. Akashdeep Negi ', '', '6396206275', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ME'),
(271, '1602112402', 'Mr. Harvindra Singh', '', '6395603306', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ME'),
(272, '1624112297', 'Dr Neeraj Sengar ', '', '8449440086', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ME'),
(273, '1693112428', 'Dr. Pravat Ranjan Pati (RF)', '', '9178659699', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'ME'),
(274, '16112723', 'Dr. Manvandra Kumar Singh (RF)', '', '9929224882', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'ME'),
(275, '1602112370', 'Dr. Gopal  Ji (RF)', '', '9628890414', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'ME'),
(276, '1602112492', 'Dr. Vineet Kumar (RF)', '', '9795069991', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ME'),
(277, '16113412', 'Dr. Royal Madan (RF)', '', '7987111910', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ME'),
(278, '16113980', 'Mr. Aqueel Ahmed (RF)', '', '8423484028', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ME'),
(279, '16V9102199', 'Mr. Syed Farrukh Rasheed', '', '9675101707', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ME'),
(280, '16225854', 'Dr Dinesh Kumar Vishwakarma (RF)', '', '9670791406', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ME'),
(281, '1924210415', 'Dr. Seema Saini', '', '9675078868', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'Mathematics'),
(282, '1924111434', 'Dr. Neeraj Dhiman', '', '9927861300', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'Mathematics'),
(283, '1902212896', 'Dr. Deepika Saini', '', '7351024680', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'Mathematics'),
(284, '1902113157', 'Dr. Abhinav Goel', '', '9027545379', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'Mathematics'),
(285, '1902210685', 'Dr. Prachi Juyal', '', '9650522116', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'Mathematics'),
(286, '1902213232', 'Dr. Nupur Goyal', '', '7417018967', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'Mathematics'),
(287, '1902113148', 'Dr. Alok Kumar Pandey', '', '9760515920', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'Mathematics'),
(288, '1902113155', 'Dr. Dig Vijay Tanwar', '', '8532853860', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Mathematics'),
(289, '1902111649', 'Dr. Shivam', '', '7417018967', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Mathematics'),
(290, '1924110990', 'Dr. Ganga Negi', '', '9568188551', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Mathematics'),
(291, '1902212308', 'Dr. Priya Bartwal', '', '9634428255', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Mathematics'),
(292, '1902212303', 'Dr. Jaya Choudhary', '', '9520292556', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Mathematics'),
(293, '1902112498', 'Dr. Shivam Rawat', '', '9971330983', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Mathematics'),
(294, '1902212483', 'Dr. Shristi Kharola', '', '7895303251', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Mathematics'),
(295, 'N493202499', 'Dr Shipra Agarwal', '', '9997729478', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'Commerce'),
(296, 'N402112675', 'Dr Ambika Prakash Mani', '', '9012569843', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'Commerce'),
(297, 'N402112685', 'Dr. Ranjit Kumar Mukherji', '', '9897215977', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'Commerce'),
(298, 'N493113180', 'Dr. Vinay Kumar Jain', '', '9719158866', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'Commerce'),
(299, '2202112907', 'Dr. Chandan Gupta', '', '7500541482', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'Commerce'),
(300, 'N402113182', 'Dr. Satyam Prakash', '', '8218323728', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Commerce'),
(301, 'N402212900', 'Ms. Himani Upreti', '', '9194213351', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Commerce'),
(302, 'N402203237', 'Ms.Riya Sharma', '', '9953301465', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Commerce'),
(303, 'N4PT212502', 'Ms. Roohi Naaz', '', '7906342186', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Commerce'),
(304, 'N4PT112686', 'Ms. Pooja Kannojia', '', '97609 31883', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Commerce'),
(305, 'N4PT112673', 'Ms. Shruti Sharma', '', '99171 20475', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Commerce'),
(306, 'N402115792', 'Mr. Vikas Kumar', '', '7018717631', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Commerce'),
(307, 'LS02112884', 'Dr. Sanjay Kumar', '', '8476060296', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'FOOD SCIENCE & TECHNOLOGY'),
(308, 'LS02210855', 'Dr. Bindu Naik', '', '6395858768', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'FOOD SCIENCE & TECHNOLOGY'),
(309, 'LS02211424', 'Dr. Ankita Dobhal', '', '9410555990', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'FOOD SCIENCE & TECHNOLOGY'),
(310, '2112319', 'Dr. Arun Kumar', '', '9891638220', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'FOOD SCIENCE & TECHNOLOGY'),
(311, 'LSTA210853', 'Er. Bhawna Bisht', '', '8076547077', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'FOOD SCIENCE & TECHNOLOGY'),
(312, '2114088', 'Dr. Krishna Aayush', '', '9805011210', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'FOOD SCIENCE & TECHNOLOGY'),
(313, '2214126', 'Dr. Shweta Joshi', '', '9997083293', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'FOOD SCIENCE & TECHNOLOGY'),
(314, '2212235', 'Dr. Afreen Parveen', '', '8171770121', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'FOOD SCIENCE & TECHNOLOGY'),
(315, '02213759', 'Ms. Ishika Jain', '', '9720566884', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'FOOD SCIENCE & TECHNOLOGY'),
(316, '02212510', 'Ms. Aroma Joshi', '', '7895411643', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'FOOD SCIENCE & TECHNOLOGY'),
(317, '02115024', 'Dr. Yogesh Kumar', '', '8759593882', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'FOOD SCIENCE & TECHNOLOGY'),
(318, '105841', 'Dr. Vinay Kumar Pandey', '', '7905030634', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'FOOD SCIENCE & TECHNOLOGY');
INSERT INTO `users` (`id`, `employeeid`, `name`, `email`, `phone`, `pass`, `role`, `department`) VALUES
(319, '7924211028', 'Dr. Promila Sharma', '', '9756710814', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'MICROBIOLOGY'),
(320, 'LS93210916', 'Dr. Divya Venugopal', '', '9811712434', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'MICROBIOLOGY'),
(321, '7902112544', 'Dr. Manoj Pal', '', '8958912327', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'MICROBIOLOGY'),
(322, '8193212358', 'Dr. Manisha Nanda ', '', '9639648050', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'MICROBIOLOGY'),
(323, 'LS02111063', 'Dr. Amar Jyoti Das', '', '8957723434', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'MICROBIOLOGY'),
(324, '8102212225', 'Ms. Leirika Ngangom', '', '8218293678', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'MICROBIOLOGY'),
(325, '8102112431', 'Mr. Kunal Sharma', '', '6396492439', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'MICROBIOLOGY'),
(326, '8102212403', 'Ms. Mansi Chauhan', '', '8265940008', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'MICROBIOLOGY'),
(327, '8102212404', 'Ms. Ayushi Kimothi', '', '7579192311', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'MICROBIOLOGY'),
(328, '8102212228', 'Ms. Nikita Bahuguna', '', '7078518773', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'MICROBIOLOGY'),
(329, '8102212226', 'Ms. Silvi Gautam ', '', '9536115193', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'MICROBIOLOGY'),
(330, '8103114110', 'Dr. Arun Karnwal ', '', '9802143702', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'MICROBIOLOGY'),
(331, '8102112506', 'Dr. Sunil Kumar ', '', '9050955458', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'MICROBIOLOGY'),
(332, '81113297', 'Dr. Debasis Mitra ', '', '6370605142', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'MICROBIOLOGY'),
(333, '81113815', 'Dr. Saurabh Gangola ', '', '8938907887', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'MICROBIOLOGY'),
(334, '4102113039', 'Dr.Rakesh Dani', '', '9837728617', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'HM'),
(335, '4124110931', 'Dr.Ravish Kukreti', '', '9997806280', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'HM'),
(336, '4102112872', 'Mr.Mohsin Khan', '', '9411563527', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HM'),
(337, '4102213111', 'Ms.Anubala', '', '8510044065', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HM'),
(338, '41PT203181', 'Mr.Yogesh Upreti', '', '9601120920', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HM'),
(339, '4102103227', 'Mr.Sunil Lal', '', '7906858906', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HM'),
(340, '4102103242', 'Mr. Siddharth Juyal', '', '8126203550', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HM'),
(341, '4102112321', 'Mr.Vivek Rawat', '', '9927519289', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HM'),
(342, 'F302215152', 'MS. ADITI GAUR', '', '7017216667', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(343, 'F3112865', 'DR. AJAY KUMAR', '', '7566569201', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'HSS'),
(344, 'F302210605', 'MS. AMISHA BISHT ', '', '7906563635', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(345, '3002213187', 'DR ANTIMA CHAMOLI', '', '9897933662', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(346, 'F3PD210014', 'DR ANUGRAH ROHINI LALL', '', '8475825354', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(347, 'ps02210816', 'DR BHARTI SHARMA', '', '7060665568', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(348, 'P502213718', 'DR. DEBAPRIYA GANGULY', '', '8890138728', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(349, 'F302214280', 'MS. DEEPALI AGARWAL', '', '9105616033', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(350, 'PS02112079', 'DR. GAURAV DIMRI', '', '7906532203', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(351, 'P502211845', 'DR. MANASWI SEMWAL', '', '9650413496', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(352, 'F302215162', 'DR. MANSI SUNDRIYAL', '', '7500966619', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(353, 'F3111673', 'MR. NAVEEN NAVAL', '', '9634707115', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(354, 'P502114380', 'DR. PANKAJ KUMAR YADAV', '', '9996004560', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(355, 'F302115791', 'DR. RAVI SHANKAR', '', '9560034549', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(356, 'F360202876', 'MS.RINKY RAWAT', '', '7906580990', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(357, 'F302115058', 'DR. SAURAV UNIYAL', '', '8941891721', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(358, 'F302215451', 'MS. SHIVANI AMOLI', '', '8218822163', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(359, 'F302214268', 'MS. SNEHA PANDEY', '', '9599925135', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(360, 'F302112640', 'MR. SRINIVASAN', '', '9976240951', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(361, 'P502212343', 'DR.SWETA KHANDURI', '', '8171188826', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(362, 'F328200002', 'MS. SWATI ', '', '9557224874', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(363, 'P502211385', 'MS. VIDHI KAPRUWAN ', '', '7088522904', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(364, 'F302114820', 'DR. YASHPAL SINGH', '', '7838409231', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'HSS'),
(365, 'P503110932', 'Dr. Gopal Krishna Dwivedi', '', '9711163620', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'PDP'),
(366, 'P593210933', 'Dr. Taruna Anand', '', '9810878117', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'PDP'),
(367, '2581211742', 'Ms. Shweta Bajaj', '', '7895721961', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'PDP'),
(368, '1224110975', 'Mr. Abhinav Sharma', '', '9897300221', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'PDP'),
(369, 'N9TN203038', 'Ms. Priyanka Agrawal', '', '8744970869', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'PDP'),
(370, '30TN203168', 'Ms. Medhavi Vishnoi', '', '9650633439', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'PDP'),
(371, 'H9T8202855', 'Ms. Jyoti Joshi', '', '8077605282', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'PDP'),
(372, '2525112760', 'Mr. Vibhakar Ghosh', '', '7009470193', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'PDP'),
(373, '25214393', 'Ms. Jhoomer Ghosh', '', '7986169783', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'PDP'),
(374, '25114275', 'Mr. Purnendu Agarwal', '', '9643807973', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'PDP'),
(375, '902112740', 'AJAI KUMAR', '', '8114464610', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'PE'),
(376, '902113609', 'DR RAVI YADAV', '', '8685870419', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'PE'),
(377, '1724210006', 'Prof. (Dr) Kiran Sharma', '', '9719713400', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'Physics'),
(378, '1724110495', 'Prof. (Dr)  Awanish Kumar Sharma', '', '9639348343', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'Physics'),
(379, '1724111539', 'Prof. (Dr)  Deepak', '', '9411861465', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'Physics'),
(380, '1702112999', '(Dr) Kunwar Vikram', '', '7259728274', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Physics'),
(381, '1724111296', 'Prof. (Dr) Sanjeev Kimothi', '', '9456119959', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'Physics'),
(382, '1702112234', '(Mr) Ummer Bashir Khoja', '', '7006213338', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Physics'),
(383, '1702212217', '(Dr) Sakshi Juyal', '', '8755665414', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Physics'),
(384, '1393112635', 'Dr.  Sandeep Gupta', '', '8769065042', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'EE'),
(385, '1302111344', 'Dr. Mohit Bajaj', '', '8791409896', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'EE'),
(386, '1393115555', 'Dr. Nitin Sundriyal', '', '9760204690', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'EE'),
(387, '1329110136', 'Dr. Ankit Bhatt', '', '9557627287', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'EE'),
(388, '1302213133', 'Dr. Nikita Rawat', '', '89584 96158', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'EE'),
(389, '1302115165', 'Dr. Rituraj Singh Patwal', '', '9876632776', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'EE'),
(390, '1302115335', 'Dr. Sanjay Dhanka', '', '7725924176', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'EE'),
(391, '1302211925', 'Ms. Niharika Varshney', '', '8006273672', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'EE'),
(392, '1329111706', 'Mr. Ashutosh Dixit', '', '9720851300', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'EE'),
(393, '1329211449', 'Ms. Prateeksha', '', '9557162523', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'EE'),
(394, '1593212334', 'DEEPSHIKHA SHUKLA', '', '9977781298', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'Civil Engineering'),
(395, '15113333', 'BHEEM PRATAP', '', '8794604656', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Civil Engineering'),
(396, '15113972', 'KARAN SINGH', '', '9812697806', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Civil Engineering'),
(397, '15114418', 'MURALI G', '', '9944224485', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Civil Engineering'),
(398, '1502115417', 'PRAMOD KUMAR', '', '8397986811', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Civil Engineering'),
(399, '15115512', 'PARVEEN SIHAG', '', '8709923267', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Civil Engineering'),
(400, '1502111958', 'Dharampal Singh Kandari', '', '7533939310', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Civil Engineering'),
(401, '1502112519', 'P Janaki Rama Raju Patchamatla', '', '9441448630', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Civil Engineering'),
(402, '1502112652', 'Deepak Kumar Singh', '', '9557276625', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Civil Engineering'),
(403, '1502113694', 'ABHISHEK SINGH', '', '9997968713', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Civil Engineering'),
(404, '1502102986', 'Rahul Vaishnava', '', '9760682135', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Civil Engineering'),
(405, '1502111124', 'DEEPAK BAHUGUNA', '', '7017223249', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Civil Engineering'),
(406, '1502212210', 'KHUSHBOO UNIYAL', '', '9760060399', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Civil Engineering'),
(407, '1502112211', 'KAVINDRA SINGH DHAMI', '', '9412928251', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Civil Engineering'),
(408, '1502112244', 'GAURAV SINGH', '', '7895072144', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'Civil Engineering'),
(409, '1224110056', 'Dr. Pradeep Kumar Juneja', '', '8449403912', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'ECE'),
(410, '1124210034', 'Dr. Shalini Singh', '', '7060077690', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'ECE'),
(411, '1103213504', 'Dr Malathi S', '', '9742065758', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'ECE'),
(412, '1193112372', 'Dr. Varij Panwar', '', '8191829063', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'ECE'),
(413, '1124111922', 'Dr. Peyush Pande', '', '9411324378', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'ECE'),
(414, '1193113212', 'Dr. Gourav Verma', '', '9555401199', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'ECE'),
(415, '1103115285', 'Bajarang Prasad Mishra', '', '9971656287', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'ECE'),
(416, '2102110993', 'Dr. Abhay Sharma', '', '8755560999', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'ECE'),
(417, '1124112148', 'Dr. Anurag Vidyarthi', '', '9897289971', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'ECE'),
(418, '1129110905', 'Dr. Vikas Rathi', '', '9760207981', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Professor', 'ECE'),
(419, '1129111222', 'Dr. Mridul Gupta', '', '8126454455', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'ECE'),
(420, '1193112037', 'Dr. Niraj Kumar', '', '9677038667', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'ECE'),
(421, '1124210406', 'Dr. Sribidhya Mohanty', '', '9634369365', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ECE'),
(422, '1102213143', 'Dr. Chandni Tiwari', '', '9664389267', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ECE'),
(423, '11113379', 'Dr. Rajeev Kumar', '', '8057034014', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ECE'),
(424, '11113446', 'Dr. Lokendra Singh', '', '8859132877', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ECE'),
(425, '11114157', 'Dr. Ashish Kumar Singh', '', '7578861841', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ECE'),
(426, '1193115671', 'Dr. Upendra Mohan Bhatt', '', '9760059892', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Associate Professor', 'ECE'),
(427, '1125102567', 'Dr. Kamlesh Kukreti', '', '9760727914', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ECE'),
(428, '1102213179', 'Ms. Neha Belwal', '', '724878 3027', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ECE'),
(429, '1136212860', 'Ms. Alankrita Joshi', '', '99978 73145', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ECE'),
(430, '1102212411', 'Ms. Raj Gusain', '', '9456539419', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ECE'),
(431, 'TA210832', 'Ms. Priya Sharma', '', '8126341493', 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f', 'Assistant Professor', 'ECE');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `duties`
--
ALTER TABLE `duties`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `limits`
--
ALTER TABLE `limits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role` (`role`) USING HASH;

--
-- Indexes for table `preferences`
--
ALTER TABLE `preferences`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`) USING HASH;

--
-- Indexes for table `slot`
--
ALTER TABLE `slot`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employeeid` (`employeeid`) USING HASH;

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `duties`
--
ALTER TABLE `duties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `limits`
--
ALTER TABLE `limits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `preferences`
--
ALTER TABLE `preferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `slot`
--
ALTER TABLE `slot`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=432;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
